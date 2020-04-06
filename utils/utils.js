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

function validatePin(pin, callback) {
    if (typeof pin === "undefined" || pin.length < 4) {
        return callback(undefined, false)
    }

    if (/[\x00-\x03]|[\x05-\x07]/.test(pin)) {
        return callback(undefined, false);
    }

    return callback(undefined, true);
}

function checkPin(pin, callback) {
    if (typeof pin === "undefined" || pin.length < 4) {
        return callback(undefined, false)
    }

    if (/[\x00-\x03]|[\x05-\x07]/.test(pin)) {
        return callback(undefined, false);
    }

    const EDFS = require("edfs");
    EDFS.attachWithPin(pin, (err) => {
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
        getPin((err, pin) => {
            if (err) {
                console.log("Error when loading EDFs");
                return callback(err);
            }

            EDFS.attachWithPin(pin, callback);
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

        getPin((err, pin) => {
            if (err) {
                return callback(err);
            }

            edfs.loadWallet(walletSeed, pin, true, (err, wallet) => {
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

                    callback(undefined, edfs.loadRawDossier(seed));
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

let lastPin;
let timeStamp;
const PIN_LIFETIME = 5000;
global.getPin = function (callback) {
    const currentTimestamp = new Date().getTime();
    if (!lastPin || (currentTimestamp - timeStamp) > PIN_LIFETIME) {
        consoleUtils.insertPassword({validationFunction: checkPin}, (err, pin) => {
            if (err) {
                return callback(err);
            }

            lastPin = pin;
            timeStamp = new Date().getTime();
            callback(undefined, pin);
        });
    } else {
        callback(undefined, lastPin);
    }
};

module.exports = {
    getInitializedEDFS,
    validatePin,
    isAlias,
    loadWallet,
    getEDFS,
    getOwnIdentity,
    loadArchiveWithAlias,
    checkPin
};