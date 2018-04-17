module.exports = {
    getLatestRelease: function(releases, group) {
        for (release of releases) {
            if (isInGroup(release, group)) {
                return release;
            }
        }
    },

    isInGroup: isInGroup
};

function isInGroup(release, group) {
    if (release.distribution_groups) {
        for (i = 0; i < release.distribution_groups.length; i++) {
            if (release.distribution_groups[i].name == group)
                return true;
        }
    }
    return false;
}