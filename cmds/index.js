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

    return !/[\x00-\x03]|[\x05-\x07]|[\x09]|[\x0B-\x0C]|[\x0E-\x1F]/.test(pin);
}

function createCSB(domainName, constitutionPath, noSave = false) {
    const pth = "path";
    const path = require(pth);
    const EDFS = require("edfs");

    if (noSave === false) {
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

                    edfs.createBarWithConstitution(path.resolve(constitutionPath), (err, archive) => {
                        if (err) {
                            throw err;
                        }

                        const dossier = require("dossier");
                        dossier.load(wallet.getSeed(), AGENT_IDENTITY, (err, csb) => {
                            if (err) {
                                throw err;
                            }

                            csb.startTransaction("StandardCSBTransactions", "addFileAnchor", domainName, "csb", wallet.getMapDigest());
                            console.log("The CSB was created and a reference to it has been added to the wallet.");
                        });

                    });
                });
            });
        });
    } else {
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
                console.log("SEED", archive.getSeed().toString());
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
        if (!err) {
            utils.getFeedback("A wallet already exists. Do you want to create a new one?(y/n)", (err, ans) => {
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
        const edfs = getInitializedEDFS();
        utils.insertPassword({validationFunction: validatePin}, (err, pin) => {
            if (err) {
                console.log(`Caught error: ${err.message}`);
                process.exit(1);
            }

            edfs.createWallet(templateSeed, pin, overwrite, (err, seed) => {
                if (err) {
                    throw err;
                }

                console.log("Wallet with SEED was created. Please save the SEED:", seed);
            });
        });
    }
}

function listFiles(seed, folderPath) {
    const EDFS = require("edfs");
    const edfs = EDFS.attachWithSeed(seed);

    console.log("folderPath", folderPath, typeof folderPath);
    const bar = edfs.loadBar(seed);
    bar.listFiles(folderPath, (err, fileList) => {
        if (err) {
            throw err;
        }

        console.log("Files:", fileList);
    });
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

addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> <noSave>\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "archive", createArchive, "<archiveSeed> <folderPath> <noSave>\t\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("set", "app", setApp, " <archiveSeed> <folderPath> \t\t\t\t\t |add an app to an existing archive");
addCommand("list", "files", listFiles, " <archiveSeed> <folderPath> \t\t\t\t |prints the list of all files stored at path <folderPath> inside the archive whose SEED is <archiveSeed>");
addCommand("extract", "folder", extractFolder, " <archiveSeed> <archivePath> <fsFolderPath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFolderPath>");
addCommand("extract", "file", extractFile, " <archiveSeed> <archivePath> <fsFilePath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFilePath>");

