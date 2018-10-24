const is = require("interact").createInteractionSpace();
const is2 = require('interact').createRemoteInteractionSpace('testRemote', 'http://127.0.0.1:8080', 'localhost/agent/system');

function doAddRemote(...args) {
    console.error('args ', ...args);
    is2.startSwarm('domain', 'initialize', args);
}

function doGetRemotes(...args) {

    is2.startSwarm('domain', 'initialize', args).on({
        returnInfo: function(info) {
            console.log(info);
        }
    });
}


addCommand("add", "remote", doAddRemote, "<alias> <endpoint>\t\t\t\t |add a new endpoint to local domain with alias");
addCommand("get", "remotes", doGetRemotes, "<endpoint>\t\t\t\t |get current endpoint for domain</endpoint>");