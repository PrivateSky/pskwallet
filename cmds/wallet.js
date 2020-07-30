const consoleUtils = require("../utils/consoleUtils");
const utils = require("../utils/utils");
const EDFS = require("edfs");

function createWallet(templateKeySSI) {
    if (!templateKeySSI) {
        throw Error("No template seed received.")
    }
    try {
        require("key-ssi-resolver").KeySSIFactory.create(templateKeySSI)
    } catch (e) {
        throw Error("Invalid template seed");
    }

    EDFS.checkForSeedCage(err => {
        if (!err) {
            consoleUtils.getFeedback("A wallet already exists. Do you want to create a new one?(y/n)", (err, ans) => {
                if (err) {
                    throw err;
                }

                if (ans[0] === "y") {
                    __createWallet(true);
                }
            });
        } else {
            __createWallet(false);
        }
    });

    function __createWallet(overwrite) {
        consoleUtils.insertPassword({validationFunction: utils.validatePassword}, (err, password) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            consoleUtils.insertPassword({
                prompt: "Confirm password:",
                validationFunction: utils.validatePassword
            }, (err, newPassword) => {
                if (err) {
                    console.log(`Caught error: ${err.message}`);
                    process.exit(1);
                }

                if (password !== newPassword) {
                    console.log("The passwords do not coincide. Try again.");
                    __createWallet(overwrite);
                } else {
                    EDFS.createDSU("Wallet", {password, overwrite, templateKeySSI}, (err, keySSI) => {
                        if (err) {
                            throw err;
                        }

                        console.log("Wallet with KeySSI was created. Please save the KeySSI:", keySSI);
                    });
                }
            });
        });
    }
}


function restore(keySSI) {
    if (!keySSI) {
        throw Error("No keySSI received.")
    }

    if (err) {
        throw err;
    }
    __saveKeySSI();

    function __saveKeySSI() {
        consoleUtils.insertPassword({validationFunction: utils.validatePassword}, (err, password) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            consoleUtils.insertPassword({
                prompt: "Confirm password:",
                validationFunction: utils.validatePassword
            }, (err, newPassword) => {
                if (err) {
                    console.log(`Caught error: ${err.message}`);
                    process.exit(1);
                }

                if (password !== newPassword) {
                    console.log("The passwords do not coincide. Try again.");
                    __saveKeySSI();
                } else {
                    EDFS.resolveSSI(keySSI, "Wallet", {password, overwrite: true}, (err, wallet) => {
                        if (err) {
                            throw err;
                        }

                        console.log("Wallet was restored");
                    });
                }
            });
        });
    }
}

function changePassword() {
    utils.loadWallet((err, wallet) => {
        if (err) {
            throw err;
        }

        consoleUtils.insertPassword({
            prompt: "Insert a new password:",
            validationFunction: utils.validatePassword
        }, (err, password) => {
            if (err) {
                throw err;
            }

            wallet.getKeySSI((err, keySSI) => {
                if (err) {
                    throw err;
                }
                EDFS.resolveSSI(keySSI, "Wallet", {password, overwrite: true}, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("The password has been changed.");
                });
            });
        });
    });
}


addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("restore", null, restore, "<seed> \t\t\t\t |Checks the seed is valid and allows the selection of a password");
addCommand("change", "password", changePassword, "\t\t\t\t |Asks for the password and then allows for the selection of a new password");

