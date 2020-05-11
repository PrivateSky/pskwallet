const consoleUtils = require("./consoleUtils");

function getEndpoint() {
    let endpoint = process.env.EDFS_ENDPOINT;
    if (typeof endpoint === "undefined") {
        console.log("Using default endpoint. To configure set ENV['EDFS_ENDPOINT']");
        endpoint = "http://localhost:8080";
    }
    return endpoint;
}

function getInitializedEDFS() {
    const EDFS = require("edfs");
    const endpoint = getEndpoint();
    return EDFS.attachToEndpoint(endpoint);
}

function validatePassword(password, callback) {
    if (typeof password === "undefined" || password.length < 4) {
        return callback(undefined, false)
    }

    if (/[\x00-\x03]|[\x05-\x07]/.test(password)) {
        return callback(undefined, false);
    }

    return callback(undefined, true);
}

function checkPassword(password, callback) {
    if (typeof password === "undefined" || password.length < 4) {
        return callback(undefined, false)
    }

    if (/[\x00-\x03]|[\x05-\x07]/.test(password)) {
        return callback(undefined, false);
    }

    const EDFS = require("edfs");
    EDFS.attachWithPassword(password, (err) => {
        if (err) {
            return callback(undefined, false);
        }

        callback(undefined, true);
    });
}

function getEDFS(seed, callback) {
    const EDFS = require("edfs");
    if (typeof seed === "function") {
        callback = seed;
        seed = undefined;
    }

    if (typeof seed === "undefined") {
        getPassword((err, password) => {
            if (err) {
                console.log("Error when loading EDFs");
                return callback(err);
            }

            EDFS.attachWithPassword(password, callback);
        });

    } else {
        EDFS.attachWithSeed(seed, callback);
    }
}

function loadWallet(walletSeed, callback) {
    if (typeof walletSeed === "function") {
        callback = walletSeed;
        walletSeed = undefined;
    }
    getEDFS(walletSeed, (err, edfs) => {
        if (err) {
            return callback(err);
        }

        getPassword((err, password) => {
            if (err) {
                return callback(err);
            }

            edfs.loadWallet(walletSeed, password, true, (err, wallet) => {
                if (err) {
                    return callback(err);
                }

                callback(undefined, wallet);
            });
        });
    });
}

function loadArchiveWithAlias(alias, callback) {
    loadWallet(undefined, (err, wallet) => {
        if (err) {
            return callback(err);
        }

        const dossier = require("dossier");
        dossier.load(wallet.getSeed(), getOwnIdentity(), (err, csb) => {
            if (err) {
                return callback(err);
            }

            csb.startTransaction("StandardCSBTransactions", "getSeed", alias).onReturn((err, seed) => {
                if (err) {
                    return callback(err);
                }

                getEDFS(seed, (err, edfs) => {
                    if (err) {
                        return callback(err);
                    }

                    edfs.loadRawDossier(seed, (err, rawDossier) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(undefined, rawDossier);
                    })
                });
            });
        });
    });
}

function isAlias(str) {
    const Seed = require("bar").Seed;
    try {
        new Seed(str)
    } catch (e) {
        return true;
    }

    return false;
}

function getOwnIdentity() {
    return "pskwallet-identity";
}

let lastPassword;
let timeStamp;
const PASSWORD_LIFETIME = 5000;
global.getPassword = function (callback) {
    const currentTimestamp = new Date().getTime();
    if (!lastPassword || (currentTimestamp - timeStamp) > PASSWORD_LIFETIME) {
        consoleUtils.insertPassword({validationFunction: checkPassword}, (err, password) => {
            if (err) {
                return callback(err);
            }

            lastPassword = password;
            timeStamp = new Date().getTime();
            callback(undefined, password);
        });
    } else {
        callback(undefined, lastPassword);
    }
};

module.exports = {
    getInitializedEDFS,
    validatePassword,
    isAlias,
    loadWallet,
    getEDFS,
    getOwnIdentity,
    loadArchiveWithAlias,
};
