const AsyncDispatcher = require("../utils/AsyncDispatcher");
const EVFSResolver = require("./backupResolvers/EVFSResolver");

function BackupEngineBuilder() {
    const resolvers = {};
    this.addResolver = function (name, resolver) {
        resolvers[name] = resolver;
    };

    this.getBackupEngine = function () {
        return new BackupEngine(resolvers);
    }
}

function BackupEngine(resolvers) {

    this.save = function (url, csbIdentifier, dataStream, callback) {
        const asyncDispatcher = new AsyncDispatcher(callback);
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return callback(err);
                }

                resolver.save(url, csbIdentifier, dataStream, (err) => {
                    if (err) {
                        asyncDispatcher.markOneAsFinished(err);
                        return;
                    }

                    asyncDispatcher.markOneAsFinished();
                });
            });
        });
    };

    this.load = function (url, csbIdentifier, version, callback) {
        if (typeof version === "function") {
            callback = version;
        }

        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return callback(err);
                }

                resolver.load(url, csbIdentifier, (err, resource) => {
                    if (err) {
                        return callback(err);
                    }

                    callback(undefined, resource);
                });
            });

        });
    };

    this.getVersions = function (url, csbIdentifier, callback) {
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return callback(err);
                }

                resolver.getVersions(url, csbIdentifier, callback);
            });
        });
    };

    this.compareVersions = function (url, fileList, callback) {
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return callback(err);
                }

                resolver.compareVersions(url, fileList, callback);
            });
        });
    };

    //------------------------------------------------ INTERNAL METHODS ------------------------------------------------

    function resolverForUrl(url, callback) {
        Object.entries(resolvers).forEach(([name, resolver]) => {
            if (match(name, url)) {
                return callback(undefined, resolver);
            }
        });

        const resolver = resolvers['evfs'];
        if (!resolver) {
            return callback(new Error(`No resolver matches the url ${url}`));
        }

        callback(undefined, resolver);
    }

    function match(str1, str2) {
        return str1.includes(str2) || str2.includes(str1);
    }
}

const engineBuilder = new BackupEngineBuilder();

// engineBuilder.addResolver('dropbox', new DropboxResolver());
// engineBuilder.addResolver('drive', new DriveResolver());
engineBuilder.addResolver('evfs', new EVFSResolver());

module.exports = {
    getBackupEngine: function () {
        return engineBuilder.getBackupEngine();
    }
};
