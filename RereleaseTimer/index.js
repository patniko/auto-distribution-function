var request = require('request-promise');
var _ = require('lodash');
//var momment = require('moment');
//var mobileCenter = require('mobileCenter');

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();

    var token = GetEnvironmentVariable("APP_CENTER_TOKEN");
    var owner = GetEnvironmentVariable("APP_CENTER_OWNER");
    var app = GetEnvironmentVariable("APP_CENTER_APP");

    var sets = [{ "source": "Alpha Testers", "installs": 1, "sessions": 1, "crashes": 0, "destination": "Beta Testers" },
                { "source": "Beta Testers", "installs": 2, "sessions": 2, "crashes": 0, "destination": "Google Play" }];
    
    context.log(`Fetching the latest release version...`);
    var options = BuildUrl("/recent_releases", token, owner, app);
    request(options)
    .then(response => {
        context.log(response);
        var latest_releases = JSON.parse(response);

        var crashes = new Promise((resolve, reject) => {
            context.log(`Fetching crash information for version...`);
            var options = BuildUrl("/analytics/crash_counts?start=2017-09-14&versions=1.0.7", token, owner, app);
            request(options)
            .then(results => { resolve(results); })
            .error(response => {
                context.error(response);
            });
        }); 

        var sessions = new Promise((resolve, reject) => {
            context.log(`Fetching session averages for version...`);
            var options = BuildUrl("/analytics/session_durations_distribution?start=2017-09-14&versions=1.0.7", token, owner, app);
            request(options)
            .then(results => { resolve(results); })
            .error(response => {
                context.error(response);
            });
        }); 

        var installs = new Promise((resolve, reject) => {
            context.log(`Fetching total installs for version...`);
            var options = BuildUrl("/analytics/versions?start=2017-08-01&versions=1.0.7", token, owner, app);
            request(options)
            .then(results => { resolve(results); })
            .error(response => {
                context.error(response);
            });
        }); 

        Promise.all([crashes, sessions, installs]).then(values => { 
            console.log(values); // [3, 1337, "foo"] 
          });

    })
    .error(response => {
        context.error(response);
    });

    context.log(`Checking conditions...`);

    context.log(`Re-releasing latest version...`);

    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    context.done();




    //request('http://www.google.com/', function(error, response, body) {
    //    context.log("inside request callback");
    //    context.done(); 
    //});

};

function BuildUrl(endpoint, token, owner, app) {
    var options = {
        headers: { 'Accept': 'application/json', 'X-API-Token': token },
        url: `https://api.mobile.azure.com/v0.1/apps/${owner}/${app}${endpoint}`
    };
    return options;
}

function GetEnvironmentVariable(name)
{
    return process.env[name];
}