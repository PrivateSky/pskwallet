const configTransactionSwarm = {
    meta: {
        swarmName: 'swarm',
        swarmId: 'remotes'
    },
    swarmName: "swarm"
};

$$.swarm.describe('remotes', {
    set: function (alias, endpoint) {
        const transaction  = $$.blockchain.beginTransaction(configTransactionSwarm);
        const remotesSwarm = transaction.lookup('global.remote', alias);

        if (!remotesSwarm) {
            this.swarm('interaction', '__return__', new Error('Could not find swarm named "global.remote"'));
            return;
        }

        remotesSwarm.init(alias, endpoint);
        transaction.add(remotesSwarm);

        $$.blockchain.commit(transaction);
        this.swarm('interaction', '__return__');
    },
    getRemote: function (alias) {
        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);

        if (!alias) {
            this.swarm('interaction', '__return__', new Error('Missing alias'));
            return;
        }

        const remote = transaction.lookup('global.remote', alias);

        if (!remote) {
            this.swarm('interaction', '__return__', undefined, undefined);
        } else {
            this.swarm('interaction', '__return__', undefined, remote.endpoint);
        }
    },
    getRemotes: function () {
        const transaction = $$.blockchain.beginTransaction(configTransactionSwarm);
        const remotes     = transaction.loadAssets('global.remote') || [];

        this.swarm('interaction', '__return__', undefined, remotes.map(remote => remote.getRawData()));
    }
});