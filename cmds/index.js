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

function createArchive(folderPath){
    const path = require("path");
    const edfs = getInitializedEDFS();

    edfs.createBarWithConstitution(path.resolve(folderPath), (err, archive)=>{
        if(err){
            throw err;
        }
        console.log("New SEED:", archive.getSeed().toString());
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


addCommand("createArchive", null, createArchive, "<folderPath> \t\t\t\t |create an archive containing constitutions folder <folderPath> ");
addCommand("addApp", null, addApp, " <archiveSeed> <folderPath> \t\t\t\t |add an app to an existing archive");