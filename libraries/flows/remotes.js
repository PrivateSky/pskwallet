const configTransactionSwarm = {
    meta: {
        swarmName: 'swarm',
        swarmId: 'remotes'
    },
    swarmName: "swarm"
};

$$.swarm.describe('remotes', {
    set: function (alias, endpoint) {

        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);

        const remotesSwarm = transaction.lookup('global.remote', 'remotes');
        if (!remotesSwarm) {
            this.swarm('interaction', '__return__', new Error('Could not find swarm named "global.remote"'));
            return;
        }

        remotesSwarm.init('remotes');
        remotesSwarm.addRemote(alias, endpoint);
        transaction.add(remotesSwarm);

        $$.blockchain.commit(transaction);
        this.swarm('interaction', '__return__');
    },
    get: function (alias) {
        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);

        const swarm = transaction.lookup('global.remote', 'remotes');

        if(!swarm) {
            this.swarm('interaction', '__return__', new Error('Could not find swarm named "global.remote"'));
            return;
        }

        if(alias) {
            this.swarm('interaction', '__return__', undefined, swarm.remotes[alias]);
        } else {
            this.swarm('interaction', '__return__', undefined, swarm.remotes);
        }
    }
});