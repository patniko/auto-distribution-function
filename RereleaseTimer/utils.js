const SESSION_DURATIONS = ["30s-1min", "1-30min", "30min-1h"];

module.exports = {
    getLatestRelease: function(releases, sourceGroup) {

        // "releases" contains an array with one latest release for each distribution group.
        for (release of releases) {
            if (isInGroup(release, sourceGroup)) {
                return release;
            }
        }
    },

    getSessionCount: function(distribution) {

        // Take only those session durations that are listed in the array above:
        return distribution.filter((sessionDuration) => {
            return SESSION_DURATIONS.indexOf(sessionDuration.bucket) >= 0;
        }).map(sessionType => {

            // Take their "count" properties:
            return sessionType.count;
        }).reduce((a, b) => {
            
            // Make a sum of all "count" properties:
            return a + b;
        }, 0);
    },

    isInGroup: isInGroup
};

function isInGroup(release, group) {
    if (release.distribution_groups) {
        for (distributionGroup of release.distribution_groups) {
            if (distributionGroup.name == group)
                return true;
        }
    }
    return false;
}