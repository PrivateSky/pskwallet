const consoleUtils = require("./consoleUtils");
const EDFS = require("edfs");

function getEndpoint() {
    let endpoint = process.env.EDFS_ENDPOINT;
    if (typeof endpoint === "undefined") {
        console.log("Using default endpoint. To configure set ENV['EDFS_ENDPOINT']");
        endpoint = "http://localhost:8080";
    }
    return endpoint;
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
}

function loadWallet(keySSI, callback) {
    if (typeof keySSI === "function") {
        callback = keySSI;
        keySSI = undefined;
    }

    getPassword((err, password) => {
        if (err) {
            return callback(err);
        }


        EDFS.resolveSSI(keySSI, "Wallet", {password, overwrite: true}, (err, wallet) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, wallet);
        });
    });
}

function loadArchiveWithAlias(alias, callback) {
    loadWallet(undefined, (err, wallet) => {
        if (err) {
            return callback(err);
        }

        const dossier = require("dossier");
        wallet.getKeySSIAsString((err, keySSI) => {
            if (err) {
                return callback(err);
            }
            dossier.load(keySSI, getOwnIdentity(), (err, csb) => {
                if (err) {
                    return callback(err);
                }

                csb.startTransaction("StandardCSBTransactions", "getSeed", alias).onReturn((err, keySSI) => {
                    if (err) {
                        return callback(err);
                    }

                    EDFS.resolveSSI(keySSI, "RawDossier", (err, rawDossier) => {
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
    try {
        require("key-ssi-resolver").KeySSIFactory.create(str);
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
    validatePassword,
    isAlias,
    loadWallet,
    getOwnIdentity,
    loadArchiveWithAlias,
};
