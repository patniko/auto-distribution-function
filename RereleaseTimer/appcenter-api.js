const request = require('request-promise');
const utils = require('./utils');
const token = process.env["APP_CENTER_TOKEN"];

module.exports = {
    getCrashes: function (release, owner, app) {
        return makeRequest(`/analytics/crash_counts?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app)
            .then(results => {
                return results.count || 0;
            });
    },

    getSessions: function (release, owner, app) {
        return makeRequest(`/analytics/session_durations_distribution?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app)
            .then(results => {
                return results.distribution ? utils.getSessionCount(results.distribution) : 0;
            });
    },

    getInstallations: function (release, owner, app) {
        return makeRequest(`/analytics/versions?start=${release.uploaded_at}&versions=${release.short_version}`, token, owner, app)
            .then(results => {
                return results.versions && results.versions[0] ? results.versions[0].count : 0;
            });
    },

    getDestinationGroup: function (owner, app, rule) {
        switch (rule.type) {
            case "store":
                return makeRequest(`/distribution_stores/${rule.destination}`, token, owner, app);
            default:
                return makeRequest(`/distribution_groups/${rule.destination}`, token, owner, app);
        }
    },

    getRecentReleases: function (owner, app, rule) {
        return makeRequest(`/recent_releases`, token, owner, app);
    },

    getRelease: function (owner, app, release) {
        return makeRequest(`/releases/${release}`, token, owner, app);
    },

    makeRelease: function (owner, app, id, release) {
        return makeRequest(`/releases/${id}`, token, owner, app, release);
    }
};

function buildUrl(endpoint, token, owner, app) {
    const options = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Token': token
        },
        url: `https://api.appcenter.ms/v0.1/apps/${owner}/${app}${endpoint}`
    };
    return options;
}

function makeRequest(endpoint, token, owner, app, body) {
    var options = buildUrl(endpoint, token, owner, app);
    if (body) {

        // Method can only be PATCH for now, but in the future we may need to consider specifying HTTP_METHOD explicitly.
        Object.assign(options, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    }
    return request(options)
        .then(result => {
            result = JSON.parse(result);
            if (result) {
                return result;
            }
            return;
        }).catch((error) => {
            if (error.statusCode === 401) {
                throw new Error("401 Unauthorized. Please check that you have set a valid APP_CENTER_TOKEN in local.settings.")
            } else if (error.statusCode === 404) {
                throw new Error("404 Not Found. Please double check the app owner, app name and destination group name in config. Url: " + options.url);
            }
            throw error;
        });
}