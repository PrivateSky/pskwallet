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

function createArchive(folderPath, domainName){
    const path = require("path");
    const EDFS = require("edfs");
    const edfs = getInitializedEDFS();

    edfs.createBarWithConstitution(path.resolve(folderPath), (err, archive)=>{
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

addCommand("create", "archive", createArchive, "<folderPath> <domainName> \t\t\t\t |create an archive containing constitutions folder <folderPath> for Domain <domainName>");
addCommand("add", "app", addApp, " <archiveSeed> <folderPath> \t\t\t\t |add an app to an existing archive");