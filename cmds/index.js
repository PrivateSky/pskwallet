function getEndpoint(){
    let endpoint = process.env.EDFS_ENDPOINT;
    if(typeof endpoint === "undefined"){
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

function createCSB(domainName, constitutionPath){
    const path = require("path");
    const EDFS = require("edfs");
    const edfs = getInitializedEDFS();

    edfs.createBarWithConstitution(path.resolve(constitutionPath), (err, archive)=>{
        if(err){
            throw err;
        }
        archive.writeFile(EDFS.constants.CSB.DOMAIN_IDENTITY_FILE, domainName, ()=>{
            if(err){
                throw err;
            }
            console.log("SEED", archive.getSeed().toString());
        });
    });
}

function addApp(archiveSeed, appPath) {
    if(!archiveSeed) {
        throw new Error('Missing first argument, the archive seed');
    }

    if(!appPath) {
        throw new Error('Missing the second argument, the app path');
    }

    const EDFS = require("edfs");
    const edfs = getInitializedEDFS();

    const bar = edfs.loadBar(archiveSeed);
    bar.addFolder(appPath, EDFS.constants.CSB.APP_FOLDER, (err) => {
        if(err) {
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
    edfs.loadCSB(templateSeed, (err, rawCSB) => {
        if (err) {
            throw err;
        }

        rawCSB.clone((err, cloneSEED) => {
            if (err) {
                throw err;
            }

            console.log("Clone SEED:", cloneSEED.toString());
        });
    });
}

addCommand("create", "csb", createCSB, "<domainName> <constitutionPath> \t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "archive", createArchive, "<alias> <folderPath> \t\t\t\t |creates an archive containing constitutions folder <constitutionPath> for Domain <domainName>");
addCommand("create", "wallet", createWallet, "<templateSeed> \t\t\t\t |creates a clone of the CSB whose SEED is <templateSeed>");
addCommand("add", "app", addApp, " <archiveSeed> <folderPath> \t\t\t\t |add an app to an existing archive");
