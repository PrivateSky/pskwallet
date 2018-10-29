const interactionSpace = require("interact").createInteractionSpace();

function doAddRemote(...args) {
    interactionSpace.startSwarm('remotes', 'set', ...args).onReturn(function (err) {
        if (err) {
            console.error(err);
        }
    });
}

function doGetRemotes(...args) {
    interactionSpace.startSwarm('remotes', 'get', ...args).onReturn(function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(result);
    });
}


addCommand("add", "remote", doAddRemote, "<alias> <endpoint>\t\t\t\t |add a new endpoint to local domain with alias");
addCommand("get", "remotes", doGetRemotes, "<endpoint>\t\t\t\t |get current endpoint for domain</endpoint>");