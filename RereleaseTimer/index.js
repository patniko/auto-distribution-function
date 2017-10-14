var request = require('request');

//var momment = require('moment');
//var mobileCenter = require('mobileCenter');

module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }

    context.log(`Fetching the latest release version...`);
    // curl -X GET "https://api.mobile.azure.com/v0.1/apps/Mobile-Center-Tester-Apps/MC-Tester-App-iOS/recent_releases" 
    // -H "accept: application/json" -H "X-API-Token: fc4e0d7e807ba6161c720c851992deaeec566e75"

    context.log(`Fetching crash information for version...`);
    //curl -X GET "https://api.mobile.azure.com/v0.1/apps/Mobile-Center-Tester-Apps/MC-Tester-App-iOS/analytics/crash_counts?start=2017-09-14" 
    //-H "accept: application/json" -H "X-API-Token: fc4e0d7e807ba6161c720c851992deaeec566e75"
    
    context.log(`Fetching session averages for version...`);
    //curl -X GET "https://api.mobile.azure.com/v0.1/apps/Mobile-Center-Tester-Apps/MC-Tester-App-iOS/analytics/session_durations_distribution?start=2017-09-14&versions=1.0.7" 
    // -H "accept: application/json" -H "X-API-Token: fc4e0d7e807ba6161c720c851992deaeec566e75"
    
    context.log(`Fetching total installs for version...`);
    // curl -X GET "https://api.mobile.azure.com/v0.1/apps/Mobile-Center-Tester-Apps/MC-Tester-App-iOS/analytics/versions?start=2017-08-01&versions=1.0.7" 
    // -H "accept: application/json" -H "X-API-Token: fc4e0d7e807ba6161c720c851992deaeec566e75"

    context.log(`Checking conditions...`);

    context.log(`Re-releasing latest version...`);

    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    context.done();

        /*request('http://www.google.com/', function(error, response, body) {
        context.log("inside request callback");
        context.done(); 
    });*/
};