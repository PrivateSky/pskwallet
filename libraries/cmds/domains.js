const interact = require('interact');
const interactionSpace = interact.createInteractionSpace();


function createDomain(role, domainName, remoteAlias) {
    if (!domainName || !remoteAlias) {
        console.error('Missing arguments');
        return;
    }

    interactionSpace.startSwarm('remotes', 'getRemote', remoteAlias).onReturn(function (err, remoteAddress) {
        if (err) {
            console.error(err);
            return;
        }

        if (!remoteAddress) {
            // treat this case
            return;
        }

        const remoteInteractionSpace = interact.createRemoteInteractionSpace(remoteAlias, remoteAddress, 'localhost/agent/system');

        remoteInteractionSpace.startSwarm('domains', 'add', role, domainName).onReturn(function (err, key) {
            if (err) {
                console.error(err);
            }

        });

    });
}


function getDomain(domainName, remoteAlias) {
    if (!domainName || !remoteAlias) {
        console.error('Missing arguments');
        return;
    }

    interactionSpace.startSwarm('remotes', 'getRemote', remoteAlias).onReturn(function (err, remoteAddress) {
        if (err) {
            console.error(err);
            return;
        }

        if (!remoteAddress) {
            // treat this case
            return;
        }

        const remoteInteractionSpace = interact.createRemoteInteractionSpace(remoteAlias, remoteAddress, 'localhost/agent/system');

        remoteInteractionSpace.startSwarm('domains', 'getDomain', domainName).onReturn(function (err, key) {
            if (err) {
                console.error(err);
            }
            console.log(key);
        });

    });
}

function getDomains(remoteAlias) {
    if(!remoteAlias) {
        console.error('Missing arguments');
        return;
    }

    interactionSpace.startSwarm('remotes', 'getRemote', remoteAlias).onReturn(function (err, remoteAddress) {
        if (err) {
            console.error(err);
            return;
        }

        if (!remoteAddress) {
            // treat this case
            return;
        }

        const remoteInteractionSpace = interact.createRemoteInteractionSpace(remoteAlias, remoteAddress, 'localhost/agent/system');

        remoteInteractionSpace.startSwarm('domains', 'getDomains').onReturn(function (err, key) {
            if (err) {
                console.error(err);
            }
            console.log(key);
        });

    });
}

addCommand("create", "domain", createDomain, "<domainName> <remoteName> \t\t\t\t |add a new domain in the specified remote");
addCommand("get", "domain", getDomain, "<domainName> <remoteName> \t\t\t\t |add a new domain in the specified remote");
addCommand("get", "domains", getDomains, "<remoteName> \t\t\t\t |add a new domain in the specified remote");