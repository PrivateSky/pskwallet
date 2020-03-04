const consoleUtils = require("../utils/consoleUtils");
const utils = require("../utils/utils");
const AGENT_IDENTITY = require("../utils/utils").getOwnIdentity();

function createCSB(domainName, constitutionPath, noSave) {
    const pth = "path";
    const path = require(pth);
    const EDFS = require("edfs");

    if (noSave === "nosave") {
        const edfs = utils.getInitializedEDFS();
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
        getPin((err, pin) => {
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
    const edfs = utils.getInitializedEDFS();

    const bar = edfs.loadBar(archiveSeed);
    bar.addFolder(appPath, EDFS.constants.CSB.APP_FOLDER, (err) => {
        if (err) {
            throw err;
        }

        console.log('All done');
    })
}

addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> <noSave>\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("set", "app", setApp, " <archiveSeed> <folderPath> \t\t\t\t\t |add an app to an existing archive");
