const OwM = require('swarmutils').OwM;
const pskdb = require('pskdb');

function RawCSB(initData) {
	const data = new OwM(initData);
	let blockchain = null;

	data.setInBlockchain = function () {
		if(!blockchain){
			blockchain = pskdb.startCsbDb( {getInitValues, persist});
		}

		const transaction = blockchain.beginTransaction({});
		const asset = transaction.lookup(assetType, aid);
		transaction.add(asset);

		blockchain.commit(transaction);
	};

	/* internal functions */

	function persist(transactionLog, internalValues, currentPulse) {
		transactionLog.currentPulse = currentPulse;

		if(!data.blockchain) {
			data.blockchain = {
				transactionLog : ''
			};
		}

		data.blockchain.internalValues = JSON.stringify(internalValues, null, 1);
		data.blockchain.transactionLog += mkSingleLine(JSON.stringify(transactionLog)) + "\n";
	}

	function getInitValues () {
		if(!data.blockchain) {
			return null;
		}

		return data.blockchain;
	}

	function mkSingleLine(str) {
		return str.replace(/\n|\r/g, "");
	}

	return data;
}