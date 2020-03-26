const consoleUtils = require("../utils/consoleUtils");
const utils = require("../utils/utils");

function createWallet(templateSeed) {
    const Seed = require("bar").Seed;
    try {
        new Seed(templateSeed);
    } catch (e) {
        throw Error("Invalid template seed");
    }

    const EDFS = require("edfs");
    EDFS.checkForSeedCage(err => {
        const edfs = utils.getInitializedEDFS();
        if (!err) {
            consoleUtils.getFeedback("A wallet already exists. Do you want to create a new one?(y/n)", (err, ans) => {
                if (err) {
                    throw err;
                }

                if (ans[0] === "y") {
                    __createWallet(edfs, true);
                }
            });
        } else {
            __createWallet(edfs, false);
        }
    });

    function __createWallet(edfs, overwrite) {
        consoleUtils.insertPassword({validationFunction: utils.validatePin}, (err, pin) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            consoleUtils.insertPassword({
                prompt: "Confirm pin:",
                validationFunction: utils.validatePin
            }, (err, newPin) => {
                if (err) {
                    console.log(`Caught error: ${err.message}`);
                    process.exit(1);
                }

                if (pin !== newPin) {
                    console.log("The PINs do not coincide. Try again.");
                    __createWallet(edfs, overwrite);
                } else {
                    edfs.createWallet(templateSeed, pin, overwrite, (err, seed) => {
                        if (err) {
                            throw err;
                        }

                        console.log("Wallet with SEED was created. Please save the SEED:", seed);
                    });
                }
            });
        });
    }
}


function restore(seed) {
    const EDFS = require("edfs");
    let edfs;
    try {
        edfs = EDFS.attachWithSeed(seed);
    } catch (e) {
        throw Error("The provided seed is invalid.");
    }

    __saveSeed();

    function __saveSeed() {
        consoleUtils.insertPassword({validationFunction: utils.validatePin}, (err, pin) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            consoleUtils.insertPassword({
                prompt: "Confirm pin:",
                validationFunction: utils.validatePin
            }, (err, newPin) => {
                if (err) {
                    console.log(`Caught error: ${err.message}`);
                    process.exit(1);
                }

                if (pin !== newPin) {
                    console.log("The PINs do not coincide. Try again.");
                    __saveSeed();
                } else {
                    edfs.loadWallet(seed, pin, true, (err, wallet) => {
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

function changePin() {
    utils.loadWallet((err, wallet) => {
        if (err) {
            throw err;
        }

        consoleUtils.insertPassword({prompt: "Insert a new PIN:", validationFunction: utils.validatePin}, (err, pin) => {
            if (err) {
                throw err;
            }

            utils.getEDFS(wallet.getSeed(), (err, edfs) => {
                if (err) {
                    throw err;
                }

                edfs.loadWallet(wallet.getSeed(), pin, true, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("The PIN has been changed.");
                });
            });
        });
    });
}

function mount(path, name, archiveIdentifier) {
    utils.loadWallet((err, wallet) => {
        if (err) {
            throw err;
        }

        wallet.mount(path, name, archiveIdentifier, (err) => {
            if (err) {
                throw err;
            }

            console.log("Successfully mounted");
        });
    });
}

function unmount(path, name) {
    utils.loadWallet((err, wallet) => {
        if (err) {
            throw err;
        }

        wallet.unmount(path, name, (err) => {
            if (err) {
                throw err;
            }

            console.log("Successfully unmounted");
        });
    });
}

function listMounts(path) {
    utils.loadWallet((err, wallet) => {
        if (err) {
            throw err;
        }

        wallet.listMountedDossiers(path, (err, mounts) => {
            if (err) {
                throw err;
            }

            console.log(mounts);
        });
    });
}

addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("restore", null, restore, "<seed> \t\t\t\t |Checks the seed is valid and allows the selection of a PIN");
addCommand("change", "pin", changePin, "\t\t\t\t |Asks for the PIN and then allows for the selection of a new PIN");
addCommand("mount", null, mount, "<path> <name> <seed> \t\t\t\t |Mounts the dossier having the seed <seed> at <path>/<name>");
addCommand("unmount", null,  unmount, "<path> <name>\t\t\t\t |Unmounts the dossier mounted at <path>/<name>");
addCommand("list", "mounts",  listMounts, "<path>\t\t\t\t |Lists the seeds of all dossiers mounted at <path>");
