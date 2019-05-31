const AsyncDispatcher = require("../utils/AsyncDispatcher");
const EVFSResolver = require("./backupResolvers/EDFSResolvers");
const crypto = require("pskcrypto");

function BackupEngineBuilder() {
    const resolvers = {};
    this.addResolver = function (name, resolver) {
        resolvers[name] = resolver;
    };

    this.getBackupEngine = function(urls) {
        if (!urls || urls.length === 0) {
            throw new Error("No url was provided");
        }

        return new BackupEngine(urls, resolvers);
    }
}

function BackupEngine(urls, resolvers) {

    this.save = function (csbIdentifier, dataStream, callback) {
        const asyncDispatcher = new AsyncDispatcher(callback);
        asyncDispatcher.dispatchEmpty(urls.length);
        for (let url of urls) {
            resolverForUrl(url, (err, resolver) => {
                if(err){
                    return callback(err);
                }
                resolver.auth(url, undefined,(err) => {
                    if (err) {
                        return callback(err);
                    }

                    resolver.save(url, csbIdentifier, dataStream, (err) => {
                        if (err) {
                            asyncDispatcher.markOneAsFinished(err);
                            return;
                        }
                        asyncDispatcher.markOneAsFinished(undefined, url);
                    });
                });
            });
        }
    };

    this.load = function (csbIdentifier, version, callback) {
        if (typeof version === "function") {
            callback = version;
            version = "";
        }

        tryDownload(csbIdentifier, version, 0, (err, resource) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, resource);
        });
    };

    this.getVersions = function (csbIdentifier, callback) {

    };

    this.compareVersions = function (fileList, callback) {
        const url = urls[0];
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
        const keys = Object.keys(resolvers);
        let resolver;
        let i;

        for (i = 0; i < keys.length; ++i) {
            if (match(keys[i], url)) {
                resolver = resolvers[keys[i]];
                break;
            }
        }

        if (i === keys.length) {
            resolver = resolvers['evfs'];
            if (!resolver) {
                return callback(new Error(`No resolver matches the url ${url}`));
            }
        }

        callback(undefined, resolver);
    }

    function match(str1, str2) {
        return str1.includes(str2) || str2.includes(str1);
    }


    function tryDownload(csbIdentifier, version, index, callback) {
        if (index === urls.length) {
            return callback(new Error("Failed to download resource"));
        }

        const url = urls[index];
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return tryDownload(csbIdentifier, version, ++index, callback);
                }

                resolver.load(url, csbIdentifier, version, (err, resource) =>{
                    if (err) {
                        return tryDownload(csbIdentifier, version, ++index, callback);
                    }

                    callback(undefined, resource);
                });
            });

        });
    }
}

const engineBuilder = new BackupEngineBuilder();

// engineBuilder.addResolver('dropbox', new DropboxResolver());
// engineBuilder.addResolver('drive', new DriveResolver());
engineBuilder.addResolver('evfs', new EVFSResolver());

module.exports = {
    getBackupEngine: function (urls) {
        return engineBuilder.getBackupEngine(urls);
    }
};
