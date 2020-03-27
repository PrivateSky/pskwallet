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
                    console.error("Invalid pin");
                    return;
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

function setApp(alseed, appPath) {
    if (!alseed) {
        throw new Error('Missing first argument, the archive seed or alais');
    }

    if (!appPath) {
        throw new Error('Missing the second argument, the app path');
    }

    const EDFS = require("edfs");
    if (utils.isAlias(alseed)) {
        utils.loadArchiveWithAlias(alseed, (err, bar) => {
            if (err) {
                throw err;
            }

            bar.addFolder(appPath, EDFS.constants.CSB.APP_FOLDER, (err) => {
                if (err) {
                    throw err;
                }

                console.log('All done');
            })
        });
    } else {
        utils.getEDFS(alseed, (err, edfs) => {
            if (err) {
                throw err;
            }

            const bar = edfs.loadBar(alseed);
            bar.addFolder(appPath, EDFS.constants.CSB.APP_FOLDER, (err) => {
                if (err) {
                    throw err;
                }

                console.log('All done');
            })
        });
    }
}

function mount(alseed, path, name, archiveIdentifier) {
    if (arguments.length === 3) {
        archiveIdentifier = name;
        name = path;
        path = alseed;
        alseed = undefined;
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
    } else {
        if (utils.isAlias(alseed)) {
            utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                rawDossier.mount(path, name, archiveIdentifier, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Successfully mounted.");
                    process.exit(0);
                });
            });
        } else {
            utils.getEDFS(alseed, (err, edfs) => {
                if (err) {
                    throw err;
                }

                const rawDossier = edfs.loadRawDossier(alseed);
                rawDossier.mount(path, name, archiveIdentifier, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Successfully mounted.");
                });
            });
        }
    }
}

function unmount(alseed, path, name) {
    if (arguments.length === 2) {
        name = path;
        path = alseed;
        alseed = undefined;
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
    } else {
        if (utils.isAlias(alseed)) {
            utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                rawDossier.unmount(path, name, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Successfully unmounted.");
                    process.exit(0);
                });
            });
        } else {
            utils.getEDFS(alseed, (err, edfs) => {
                if (err) {
                    throw err;
                }

                const rawDossier = edfs.loadRawDossier(alseed);
                rawDossier.unmount(path, name, (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Successfully unmounted.");
                });
            });
        }
    }
}

function listMounts(alseed, path) {
    if (arguments.length === 1) {
        path = alseed;
        alseed = undefined;
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
    } else {
        if (utils.isAlias(alseed)) {
            utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                rawDossier.listMountedDossiers(path, (err, mounts) => {
                    if (err) {
                        throw err;
                    }

                    console.log(mounts);
                    process.exit(0);
                });
            });
        } else {
            utils.getEDFS(alseed, (err, edfs) => {
                if (err) {
                    throw err;
                }

                const rawDossier = edfs.loadRawDossier(alseed);
                rawDossier.listMountedDossiers(path, (err, mounts) => {
                    if (err) {
                        throw err;
                    }

                    console.log(mounts);
                });
            });
        }
    }
}

addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> <nosave>\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("set", "app", setApp, " <seed>/<alias> <folderPath> \t\t\t\t\t |add an app to an existing archive");
addCommand("mount", null, mount, "<seed>/<alias> <path> <name> <archiveIdentifier> <> \t\t\t\t |Mounts the dossier having the seed <seed> at <path>/<name>");
addCommand("unmount", null,  unmount, "<seed>/<alias> <path> <name>\t\t\t\t |Unmounts the dossier mounted at <path>/<name>");
addCommand("list", "mounts",  listMounts, "<seed>/<alias> <path>\t\t\t\t |Lists the seeds of all dossiers mounted at <path>");