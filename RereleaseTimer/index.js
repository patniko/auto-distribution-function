var request = require('request-promise');
var _ = require('lodash');

module.exports = function (context, myTimer) {
    const timeStamp = new Date().toISOString();

    const token = GetEnvironmentVariable("APP_CENTER_TOKEN");
    const rules = require('./config.json');

    for(rule of rules) 
    {
        const owner = rule.owner;
        const app = rule.app;
        const source = rule.source;
        const destination = rule.destination;

        context.log(`Processing rule for ${app} (${source} -> ${destination})...`);
        var options = BuildUrl("/recent_releases", token, owner, app);
        request(options) 
        .then(response => {
            var releases = JSON.parse(response);

            let release = undefined;
            for(i = 0; i < releases.length; i++) {
                if(IsInGroup(releases[i], source)) {
                    release = releases[i];
                    break;
                }
            }

            if(IsInGroup(release, destination))
            {
                context.log("Latest release has already been distributed to the destination.");
                release = undefined;
            }

            if(release) {
            var crashes = new Promise((resolve, reject) => {
                context.log(`Fetching crash information for version...`);
                var options = BuildUrl(`/analytics/crash_counts?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app);
                request(options)
                .then(results => {
                    results = JSON.parse(results);
                    if(results.count)
                        resolve(results.count);
                    else
                        resolve(0);
                })
                .error(response => {
                    context.error(response);
                });
            }); 
    
            var sessions = new Promise((resolve, reject) => {
                context.log(`Fetching session averages for version...`);
                var options = BuildUrl(`/analytics/session_durations_distribution?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app);
                request(options)
                .then(results => {
                    results = JSON.parse(results);
                    if(results.distribution && results.distribution[2])
                        resolve(results.distribution[2].count);
                    else
                        resolve(0);
                })
                .error(response => {
                    context.error(response);
                });
            }); 
    
            var installs = new Promise((resolve, reject) => {
                context.log(`Fetching total installs for version...`);
                var options = BuildUrl(`/analytics/versions?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app);
                request(options)
                .then(results => {
                    results = JSON.parse(results);
                    if (results.versions && results.versions[0])
                        resolve(results.versions[0].count);
                    else
                        resolve(0);
                })
                .error(response => {
                    context.error(response);
                });
            }); 
    
            Promise.all([crashes, sessions, installs]).then(values => { 
                
                context.log(`Checking conditions...`);
                if (crashes <= rule.crashes &&
                    installs >= rule.installs &&
                    sessions >= rule.sessions) {

                        context.log(`Re-releasing latest version...`);
                }
              });
            }
        })
        .error(response => {
            context.error(response);
        });
    }
};

function GetEnvironmentVariable(name)
{
    return process.env[name];
}

function BuildUrl(endpoint, token, owner, app) {
    const options = {
        headers: { 'Accept': 'application/json', 'X-API-Token': token },
        url: `https://api.mobile.azure.com/v0.1/apps/${owner}/${app}${endpoint}`
    };
    return options;
}

function IsInGroup(release, group) {
    if(release.distribution_groups) {
        for(i = 0; i < release.distribution_groups.length; i++) {
            if(release.distribution_groups[i].name == group)
                return true;
        }
    }
    return false;
}
