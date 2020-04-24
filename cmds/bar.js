const utils = require("../utils/utils");

function listFiles(alseed, folderPath) {
    if (arguments.length === 0) {
        throw Error("Expected at least one argument. Received zero");
    }
    if (arguments.length === 1) {
        folderPath = alseed;
        utils.loadWallet(undefined, (err, wallet) => {
            if (err) {
                throw err;
            }

            wallet.listFiles(folderPath, (err, files) => {
                if (err) {
                    throw err;
                }

                console.log("Files:", files);
            });
        });
    } else {
        if (utils.isAlias(alseed)) {
            utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                rawDossier.listFiles(folderPath, (err, fileList) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Files:", fileList);
                    process.exit(0);
                });
            });
        } else {
            utils.getEDFS(alseed, (err, edfs) => {
                if (err) {
                    throw err;
                }

                const rawDossier = edfs.loadRawDossier(alseed);
                rawDossier.listFiles(folderPath, (err, fileList) => {
                    if (err) {
                        throw err;
                    }

                    console.log("Files:", fileList);
                });
            });
        }
    }
}

function extractFolder(alseed, barPath, fsFolderPath) {
    if (utils.isAlias(alseed)) {
        utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
            if (err) {
                throw err;
            }

            rawDossier.extractFolder(fsFolderPath, barPath, (err) => {
                if (err) {
                    throw err;
                }

                console.log("Extracted folder.");
                process.exit(0);
            });
        });
    } else {
        utils.getEDFS(alseed, (err, edfs) => {
            if (err) {
                throw err;
            }

            const rawDossier = edfs.loadRawDossier(alseed);
            rawDossier.extractFolder(fsFolderPath, barPath, (err) => {
                if (err) {
                    throw err;
                }

                console.log("Extracted folder.");
            });
        });
    }
}

function extractFile(alseed, barPath, fsFilePath) {
    if (utils.isAlias(alseed)) {
        utils.loadArchiveWithAlias(alseed, (err, rawDossier) => {
            if (err) {
                throw err;
            }

            rawDossier.extractFile(fsFilePath, barPath, (err) => {
                if (err) {
                    throw err;
                }

                console.log("Extracted file.");
                process.exit(0);
            });
        });
    } else {
        utils.getEDFS(alseed, (err, edfs) => {
            if (err) {
                throw err;
            }

            const rawDossier = edfs.loadRawDossier(alseed);
            rawDossier.extractFile(fsFilePath, barPath, (err) => {
                if (err) {
                    throw err;
                }

                console.log("Extracted file.");
            });
        });
    }
}

addCommand("list", "files", listFiles, " <archiveSeed>/<alias> <folderPath> \t\t\t\t |prints the list of all files stored at path <folderPath> inside the archive whose SEED is <archiveSeed>. If an alias is specified then the CSB's SEED is searched from the wallet.");
addCommand("extract", "folder", extractFolder, " <archiveSeed> <archivePath> <fsFolderPath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFolderPath>");
addCommand("extract", "file", extractFile, " <archiveSeed> <archivePath> <fsFilePath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFilePath>");

