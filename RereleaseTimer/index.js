
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
        ruleSet.push(getRulePromise(rule, context).then(() => {
            context.log("Finished processing!");
        }).catch((error) => {
            context.log(error);
        }));
    }

    Promise.all(ruleSet)
        .then(values => {
            context.done();
        }).catch((error) => {
            context.done();
        });
};

async function getRulePromise(rule, context) {
    const owner = rule.owner;
    const app = rule.app;
    const sourceGroup = rule.source;
    const destinationGroup = rule.destination;
    const maxCrashes = rule.crashes;
    const minInstallations = rule.installs;
    const minSessions = rule.sessions;

    validateParameters(owner, app, sourceGroup, destinationGroup, maxCrashes, minInstallations, minSessions);

    context.log(`Processing rule for ${app} (${sourceGroup} -> ${destinationGroup})...`);
    const releases = await appCenterApi.getRecentReleases(owner, app);

    // Getting the latest release from the source group:
    const release = utils.getLatestRelease(releases, sourceGroup);
    if (!release) {
        context.log("No releases available in source group.");
        return;
    }

    // If it has been already released to the destination group, stop the execution:
    if (utils.isInGroup(release, destinationGroup)) {
        context.log(`Latest release (${release.short_version}) has already been distributed to the destination group.`);
        return;
    }

    context.log(`Checking stats for version ${release.short_version} (${release.id})...`);
    const stats = await getStats(release, owner, app);
    let [crashes, sessions, installations] = [...stats];
    context.log(`Crashes Detected: ${crashes}`);
    context.log(`Sessions (30sec-30min): ${sessions}`);
    context.log(`Total Installations: ${installations}`);

    // Proceed with the release only if 
    // - the amount of crashes since the release has been made 
    //   does not exceed the maximum amount specified in config file;
    // - the amount of installations since the release has been made 
    //   is higher than the specified in config file;
    // - the amount of event sessions since the release has been made 
    //   is higher than the specified in config file;
    if (!(crashes <= maxCrashes && installations >= minInstallations && sessions >= minSessions)) {
        context.log(`The conditions not met: nothing to perform.`);
        return;
    }

    context.log(`Re-releasing latest version...`);
    await makeRelease(owner, app, rule, release.id);
}

async function makeRelease(owner, app, rule, releaseId) {
    const group = await appCenterApi.getDestinationGroup(owner, app, rule);
    if (!group) {
        throw new Error("Could not lookup destination group for re-release.");
    }
    const newRelease = await appCenterApi.getRelease(owner, app, releaseId);
    if (!newRelease) {
        return;
    } else {
        const patchRelease = {
            destinations: [{ id: group.id, name: group.name }],
            mandatory_update: newRelease.mandatory_update,
            release_notes: newRelease.release_notes
        };
        return await appCenterApi.makeRelease(owner, app, newRelease.id, patchRelease);
    }
}

function getStats(release, owner, app) {
    const crashesPromise = appCenterApi.getCrashes(release, owner, app);
    const installationsPromise = appCenterApi.getInstallations(release, owner, app);
    const sessionsPromise = appCenterApi.getSessions(release, owner, app);
    return Promise.all([crashesPromise, sessionsPromise, installationsPromise]);
}

function validateParameters(owner, app, sourceGroup, destinationGroup, maxCrashes, minInstallations, minSessions) {
    
    // We need to make a check whether the user has specified all the properties in config.
    if (!owner) {
        throw new Error("ERROR: Invalid config file: missing 'owner' property.");
    }

    if (!app) {
        throw new Error("ERROR: Invalid config file: missing 'app' property.");
    }

    if (!sourceGroup) {
        throw new Error("ERROR: Invalid config file: missing 'source' property.");
    }

    if (!destinationGroup) {
        throw new Error("ERROR: Invalid config file: missing 'destination' property.");
    }

    if (!maxCrashes) {
        throw new Error("ERROR: Invalid config file: missing 'crashes' property.");
    }

    if (!minInstallations) {
        throw new Error("ERROR: Invalid config file: missing 'installations' property.");
    }

    if (!minSessions) {
        throw new Error("ERROR: Invalid config file: missing 'sessions' property.");
    }
}

