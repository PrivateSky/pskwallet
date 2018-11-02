const interactionSpace = require("interact").createInteractionSpace();

function addRemote(...args) {
    interactionSpace.startSwarm('remotes', 'set', ...args).onReturn(function (err) {
        if (err) {
            console.error(err);
        }
    });
}

function getRemotes(...args) {
    interactionSpace.startSwarm('remotes', 'getRemotes', ...args).onReturn(function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(result);
    });
}

function getRemote(...args) {
    interactionSpace.startSwarm('remotes', 'getRemote', ...args).onReturn(function (err, result) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(result);
    });
}

addCommand("add", "remote", addRemote, "<alias> <endpoint>\t\t\t\t |add a new remote to local domain with alias");
addCommand("get", "remote", getRemote, "<endpoint>\t\t\t\t |get endpoints for local domain");
addCommand("get", "remotes", getRemotes, "\t\t\t\t |get endpoints for local domain");