const utils = require("../utils/utils");
const AGENT_IDENTITY = require("../utils/utils").getOwnIdentity();

function listFiles(alseed, folderPath) {
    if (utils.isAlias(alseed)) {
        utils.loadWallet(undefined,  (err, wallet) => {
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

                    utils.getEDFS(seed,  (err, edfs) => {
                        if (err) {
                            console.log(err);
                            process.exit(1);
                        }

                        const bar = edfs.loadBar(seed);
                        bar.listFiles(folderPath, (err, fileList) => {
                            if (err) {
                                throw err;
                            }

                            console.log("Files:", fileList);
                            process.exit(0);
                        });
                    });
                });
            });
        });
    } else {
        utils.getEDFS(alseed, (err, edfs) => {
            if (err) {
                throw err;
            }

            const bar = edfs.loadBar(alseed);
            bar.listFiles(folderPath, (err, fileList) => {
                if (err) {
                    throw err;
                }

                console.log("Files:", fileList);
            });
        });
    }
}

function extractFolder(seed, barPath, fsFolderPath) {
    const edfs = utils.getInitializedEDFS();
    const bar = edfs.loadBar(seed);
    bar.extractFolder(fsFolderPath, barPath, (err) => {
        if (err) {
            throw err;
        }

        console.log("Extracted folder.");
    });
}

function extractFile(seed, barPath, fsFilePath) {
    const edfs = utils.getInitializedEDFS();
    const bar = edfs.loadBar(seed);
    bar.extractFile(fsFilePath, barPath, (err) => {
        if (err) {
            throw err;
        }

        console.log("Extracted file.");
    });
}

addCommand("list", "files", listFiles, " <archiveSeed>/<alias> <folderPath> \t\t\t\t |prints the list of all files stored at path <folderPath> inside the archive whose SEED is <archiveSeed>. If an alias is specified then the CSB's SEED is searched from the wallet.");
addCommand("extract", "folder", extractFolder, " <archiveSeed> <archivePath> <fsFolderPath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFolderPath>");
addCommand("extract", "file", extractFile, " <archiveSeed> <archivePath> <fsFilePath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFilePath>");

