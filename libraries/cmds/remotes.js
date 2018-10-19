const configTransactionSwarm = {
    meta: {
        swarmName: 'swarm',
        swarmId: 'remotes'
    },
    swarmName: "swarm"
};

$$.flow.describe('setRemotes', {
    set: function (alias, endpoint) {

        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);

        const remotesSwarm = transaction.lookup('global.remote', 'remotes');
        if (!remotesSwarm) {
            // error
            return;
        }

        remotesSwarm.init('remotes');
        remotesSwarm.addRemote(alias, endpoint);
        transaction.add(remotesSwarm);

        console.log(remotesSwarm);

        $$.blockchain.commit(transaction);
    },
    get: function (alias) {
        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);

        const swarm = transaction.lookup('global.remote', 'remotes');

        if(alias) {
            console.log(swarm.remotes[alias]);
            return swarm.remotes[alias];
        } else {
            console.log(swarm.remotes);
            return swarm.remotes;
        }
    }
});

const flow = $$.flow.start('setRemotes');

const getSetter = function (key) {
    return function (value) {
        flow.set(key, value);
    }
};

const getGetter = function (key) {
    return function () {
        flow.get(key);
    }
};

addCommand("add", "remote", flow.set, "<alias> <endpoint>\t\t\t\t |add a new endpoint to local domain with alias");
addCommand("get", "remotes", flow.get, "<endpoint>\t\t\t\t |get current endpoint for domain</endpoint>");