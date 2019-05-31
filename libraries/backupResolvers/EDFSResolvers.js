
function EDFSResolvers() {

    this.auth = function (url, credentials, callback) {
        const authObj = {};
        authObj.isAuthenticated = true;
        callback(undefined, authObj);
    };

    this.save = function (authObj, url, csbIdentifier, dataStream, callback) {
        if (!authObj.isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpPost(url + "/CSB/" + csbIdentifier.getUid(), dataStream, (err, res) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, res);
        });
    };

    this.load = function (authObj, url, csbIdentifier, version, callback) {
        if (!authObj.isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        if (typeof version === "function") {
            callback = version;
            version = "";
        }

        $$.remote.doHttpGet(url + "/CSB/" + csbIdentifier.getUid() + "/" + version, (err, resource) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, resource);
        });

    };

    this.getVersions = function (authObj, url, csbIdentifier, callback) {
        if (!authObj.isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpGet(url + "/CSB/" + csbIdentifier.getUid() + "/versions", (err, versions) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, JSON.parse(versions));
        });
    };

    this.compareVersions = function (authObj, url, filesList, callback) {
        if (!authObj.isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpPost(url + "/CSB/compareVersions", JSON.stringify(filesList), (err, modifiedFiles) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, modifiedFiles);
        });
    }
}

module.exports = EDFSResolvers;