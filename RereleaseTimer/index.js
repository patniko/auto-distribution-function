
const appCenterApi = require('./appcenter-api');
const utils = require('./utils');

module.exports = function (context, rereleaseTimer) {
    const rules = require('./config.json');
    if (!rules.length) {
        context.log('ERROR: Invalid config file: should be a json array of rules.');
        context.done();
        return;
    }
    const ruleSet = [];
    for (rule of rules) {
        ruleSet.push(getRulePromise(rule, context));
    }

    Promise.all(ruleSet)
        .then(values => {
            context.log("Finished processing!");
            context.done();
        }).catch((error) => {
            context.log(error);
            context.done();
        });
};

function getRulePromise(rule, context) {
    return new Promise((resolve, reject) => {
        const owner = rule.owner;
        const app = rule.app;
        const sourceGroup = rule.source;
        const destinationGroup = rule.destination;
        const maxCrashes = rule.crashes;
        const minInstallations = rule.installs;
        const minSessions = rule.sessions;
        let destGroup;

        if (!(owner && app && sourceGroup && destinationGroup && maxCrashes && minInstallations && minSessions)) {
            reject(new Error("ERROR: Invalid config file: missing one of the properties."));
        }

        context.log(`Processing rule for ${app} (${sourceGroup} -> ${destinationGroup})...`);

        appCenterApi.getRecentReleases(owner, app).then(releases => {
            let release = utils.getLatestRelease(releases, sourceGroup);
            if (!release) {
                context.log("No releases available in source group.");
                return Promise.resolve(false);
            }
            if (utils.isInGroup(release, destinationGroup)) {
                context.log(`Latest release (${release.short_version}) has already been distributed to the destination group.`);
                return Promise.resolve(false);
            }
            context.log(`Checking stats for version ${release.short_version} (${release.id})...`);
            const crashesPromise = appCenterApi.getCrashes(release, owner, app);
            const installationsPromise = appCenterApi.getInstallations(release, owner, app);
            const sessionsPromise = appCenterApi.getSessions(release, owner, app);
            return Promise.all([crashesPromise, sessionsPromise, installationsPromise]);
        }, (error) => {
            return Promise.reject(error);
        }).then(stats => {
            if (!stats) {
                return Promise.resolve(false);
            }
            let [crashes, sessions, installations] = [...stats];
            context.log(`Crashes Detected: ${crashes}`);
            context.log(`Sessions (30sec-30min): ${sessions}`);
            context.log(`Total Installations: ${installations}`);

            if (!(crashes <= maxCrashes && installations >= minInstallations && sessions >= minSessions)) {
                context.log(`Nothing to perform.`);
                return Promise.resolve(false);
            }
            context.log(`Re-releasing latest version...`);
            return appCenterApi.getDestinationGroup(owner, app, rule);
        }).then(group => {
            if (group === false) {
                return Promise.resolve(false);
            }
            if (!group) {
                return Promise.reject("Could not lookup destination group for re-release.");
            }
            destGroup = group;
            return appCenterApi.getRelease(owner, app, release.id);
        }).then(release => {
            if (!release) {
                return Promise.resolve();
            } else {
                const patch = {
                    destinations: [{ id: destGroup.id, name: destGroup.name }],
                    mandatory_update: release.mandatory_update,
                    release_notes: release.release_notes
                };
                return appCenterApi.patchRelease(owner, app, release.id, patch);
            }
        }).then((release) => {
            resolve(true);
        }, (error) => {
            reject(error);
        }).catch((error) => {
            reject(error);
        });
    });
}

