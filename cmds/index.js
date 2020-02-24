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

function createCSB(domainName, constitutionPath) {
    const pth = "path";
    const path = require(pth);
    const EDFS = require("edfs");
    const edfs = getInitializedEDFS();

    edfs.createBarWithConstitution(path.resolve(constitutionPath), (err, archive) => {
        if (err) {
            throw err;
        }
        archive.writeFile(EDFS.constants.CSB.DOMAIN_IDENTITY_FILE, domainName, () => {
            if (err) {
                throw err;
            }
            console.log("SEED", archive.getSeed().toString());
        });
    });
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

function createArchive(alias, folderPath) {
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
    const edfs = getInitializedEDFS();

    edfs.clone(templateSeed, (err, cloneSEED) => {
        if (err) {
            throw err;
        }

        console.log("Clone SEED:", cloneSEED.toString());
    });
}

function listFiles(seed, folderPath) {
    const edfs = getInitializedEDFS();
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
addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> \t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "archive", createArchive, "<alias> <folderPath> \t\t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("set", "app", setApp, " <archiveSeed> <folderPath> \t\t\t\t\t |add an app to an existing archive");
addCommand("list", "files", listFiles, " <archiveSeed> <folderPath> \t\t\t\t |prints the list of all files stored at path <folderPath> inside the archive whose SEED is <archiveSeed>");
addCommand("extract", "folder", extractFolder, " <archiveSeed> <archivePath> <fsFolderPath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFolderPath>");
addCommand("extract", "file", extractFile, " <archiveSeed> <archivePath> <fsFilePath> \t\t |extracts the folder stored at <archivePath> inside the archive whose SEED is <archiveSeed> and writes all the extracted file on disk at path <fsFilePath>");

