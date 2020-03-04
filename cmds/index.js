const utils = require("../utils/consoleUtils");
const AGENT_IDENTITY = "psk-agent";

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
    const transportAlias = "pskwallet";
    $$.brickTransportStrategiesRegistry.add(transportAlias, new EDFS.HTTPBrickTransportStrategy(endpoint));
    return EDFS.attach(transportAlias);
}

function validatePin(pin) {
    if (typeof pin === "undefined" || pin.length < 4) {
        return false;
    }

    //The regex below checks that the pin only contains utf-8 characters
    return !/[\x00-\x03]|[\x05-\x07]|[\x09]|[\x0B-\x0C]|[\x0E-\x1F]/.test(pin);
}

function createCSB(domainName, constitutionPath, noSave) {
    const pth = "path";
    const path = require(pth);
    const EDFS = require("edfs");

    if (noSave === "nosave") {
        const edfs = getInitializedEDFS();
        edfs.createBarWithConstitution(path.resolve(constitutionPath), (err, archive) => {
            if (err) {
                throw err;
            }

            archive.writeFile(EDFS.constants.CSB.DOMAIN_IDENTITY_FILE, domainName, () => {
                if (err) {
                    throw err;
                }
                console.log("The CSB was created. Its SEED is the following.");
                console.log("SEED", archive.getSeed());
            });
        });
    } else {
        utils.insertPassword({validationFunction: validatePin}, (err, pin) => {
            if (err) {
                throw err;
            }

            EDFS.attachWithPin(pin, (err, edfs) => {
                if (err) {
                    throw err;
                }

                edfs.loadWallet(undefined, pin, true, (err, wallet) => {
                    if (err) {
                        throw err;
                    }

                    const dossier = require("dossier");
                    dossier.load(wallet.getSeed(), AGENT_IDENTITY, (err, csb) => {
                        if (err) {
                            console.error(err);
                            process.exit(1);
                        }

                        csb.startTransaction("StandardCSBTransactions", "domainLookup", domainName).onReturn((err, domain) => {
                            if (err) {
                                console.log(err);
                                process.exit(1);
                            }
                            if (domain) {
                                console.log(`Domain ${domainName} already exists!`);
                                process.exit(1);
                            }
                            edfs.createBarWithConstitution(path.resolve(constitutionPath), (err, archive) => {
                                if (err) {
                                    throw err;
                                }

                                csb.startTransaction("StandardCSBTransactions", "addFileAnchor", domainName, "csb", archive.getSeed(), wallet.getMapDigest()).onReturn((err, res) => {
                                    if (err) {
                                        console.error(err);
                                        process.exit(1);
                                    }

                                    console.log("The CSB was created and a reference to it has been added to the wallet.");
                                    console.log("Its SEED is:", archive.getSeed());
                                    process.exit(0);
                                });

                            });
                        });
                    });
                });
            });
        });
    }
}

function setApp(archiveSeed, appPath) {
    if (!archiveSeed) {
        throw new Error('Missing first argument, the archive seed');
    }

    if (!appPath) {
        throw new Error('Missing the second argument, the app path');
    }

    const EDFS = require("edfs");
    const edfs = getInitializedEDFS();

    const bar = edfs.loadBar(archiveSeed);
    bar.addFolder(appPath, EDFS.constants.CSB.APP_FOLDER, (err) => {
        if (err) {
            throw err;
        }

        console.log('All done');
    })
}

function createArchive(alias, folderPath, noSave = false) {
    const pth = "path";
    const path = require(pth);
    const edfs = getInitializedEDFS();
    const bar = edfs.createBar();
    bar.addFolder(path.resolve(folderPath), folderPath, (err) => {
        if (err) {
            throw err;
        }

        console.log("SEED:", bar.getSeed().toString());
    });

}

function createWallet(templateSeed) {
    const Seed = require("bar").Seed;
    try {
        new Seed(templateSeed);
    } catch (e) {
        throw Error("Invalid template seed");
    }

    const EDFS = require("edfs");
    EDFS.checkForSeedCage(err => {
        const edfs = getInitializedEDFS();
        if (!err) {
            utils.getFeedback("A wallet already exists. Do you want to create a new one?(y/n)", (err, ans) => {
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
        utils.insertPassword({validationFunction: validatePin}, (err, pin) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            utils.insertPassword({prompt: "Confirm pin:", validationFunction: validatePin}, (err, newPin) => {
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

function initEDFSContext(seed, pin, callback) {
    const EDFS = require("edfs");
    if (!seed) {
        if (pin) {
            EDFS.attachWithPin(pin, (err, edfs) => callback(err, {edfs, pin}));
        } else {
            utils.insertPassword({validationFunction: validatePin}, (err, localPin) => {
                if (err) {
                    return callback(err);
                }

                EDFS.attachWithPin(localPin, (err, edfs) => callback(err, {edfs, pin: localPin}));
            });
        }
    } else {
        callback(undefined, {edfs: EDFS.attachWithSeed(seed)});
    }
}

function loadWallet(walletSeed, pin, callback) {
    initEDFSContext(walletSeed, pin, (err, edfsContext) => {
        if (err) {
            return callback(err);
        }
        const edfs = edfsContext.edfs;
        const readPin = edfsContext.pin;
        console.log("got edfs context", edfs, readPin);
        if (!walletSeed) {
            if (readPin) {
                edfs.loadWallet(walletSeed, readPin, true, callback);
            } else {
                utils.insertPassword({validationFunction: validatePin}, (err, localPin) => {
                    if (err) {
                        return callback(err);
                    }

                    edfs.loadWallet(walletSeed, localPin, true, callback);
                });
            }
        } else {
            edfs.loadWallet(walletSeed, pin, true, callback);
        }
    });
}

function listFiles(alseed, folderPath) {
    if (isAlias(alseed)) {
        loadWallet(undefined, undefined, (err, wallet) => {
            if (err) {
                throw err;
            }

            const dossier = require("dossier");
            dossier.load(wallet.getSeed(), AGENT_IDENTITY, (err, csb) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }

                csb.startTransaction("StandardCSBTransactions", "getSeed", alseed).onReturn((err, seed) => {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }


                    initEDFSContext(seed, undefined, (err, edfsContext) => {
                        if (err) {
                            console.log(err);
                            process.exit(1);
                        }

                        __listFiles(edfsContext.edfs, seed);
                        process.exit(0);
                    });
                });
            });
        });
    } else {
        initEDFSContext(alseed, undefined, (err, edfsContext) => {
            if (err) {
                throw err;
            }

            __listFiles(edfsContext.edfs, alseed);
        });
    }

    function __listFiles(edfs, localSeed) {
        const bar = edfs.loadBar(localSeed);
        bar.listFiles(folderPath, (err, fileList) => {
            if (err) {
                throw err;
            }

            console.log("Files:", fileList);
        });
    }
}

function extractFolder(seed, barPath, fsFolderPath) {
    const edfs = getInitializedEDFS();
    const bar = edfs.loadBar(seed);
    bar.extractFolder(fsFolderPath, barPath, (err) => {
        if (err) {
            throw err;
        }

        console.log("Extracted folder.");
    });
}

function extractFile(seed, barPath, fsFilePath) {
    const edfs = getInitializedEDFS();
    const bar = edfs.loadBar(seed);
    bar.extractFile(fsFilePath, barPath, (err) => {
        if (err) {
            throw err;
        }

        console.log("Extracted file.");
    });
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
        utils.insertPassword({validationFunction: validatePin}, (err, pin) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            utils.insertPassword({prompt: "Confirm pin:", validationFunction: validatePin}, (err, newPin) => {
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

function isAlias(str) {
    const Seed = require("bar").Seed;
    try {
        new Seed(str)
    }catch (e) {
        return true;
    }

    return false;
}

addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> <noSave>\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("restore", null, restore, "<seed> \t\t\t\t |Checks the seed is valid and allows the selection of a PIN");
addCommand("create", "archive", createArchive, "<archiveSeed> <folderPath> <noSave>\t\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("set", "app", setApp, " <archiveSeed> <folderPath> \t\t\t\t\t |add an app to an existing archive");
addCommand("list", "files", listFiles, " <archiveSeed>/<alias> <folderPath> \t\t\t\t |prints the list of all files stored at path <folderPath> inside the archive whose SEED is <archiveSeed>. If an alias is specified then the CSB's SEED is searched from the wallet.");
addCommand("extract", "folder", extractFolder, " <archiveSeed> <archivePath> <fsFolderPath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFolderPath>");
addCommand("extract", "file", extractFile, " <archiveSeed> <archivePath> <fsFilePath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFilePath>");

