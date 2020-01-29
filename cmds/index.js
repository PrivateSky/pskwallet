function getEndpoint(){
    let endpoint = process.env.EDFS_ENDPOINT;
    if(typeof endpoint === "undefined"){
        console.log("Using default endpoint. To configure set ENV['EDFS_ENDPOINT']");
        endpoint = "http://localhost:8080";
    }
    return endpoint;
}

function createArchive(folderPath){
    const path = require("path");
    const EDFS = require("../../edfs");
    const endpoint = getEndpoint();
    const transportAlias = "pskwallet";
    $$.brickTransportStrategiesRegistry.add(transportAlias, new EDFS.HTTPBrickTransportStrategy(endpoint));
    const edfs = EDFS.attach(transportAlias);
    edfs.createBarWithConstitution(path.resolve(folderPath), (err, archive)=>{
        if(err){
            throw err;
        }
        console.log("New SEED:", archive.getSeed().toString());
    });
}

addCommand("createArchive", null, createArchive, "<folderPath> \t\t\t\t |create an archive containing constitutions folder <folderPath> ");