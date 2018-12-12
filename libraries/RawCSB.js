const OwM = require('swarmutils').OwM;
const pskdb = require('pskdb');

function RawCSB(initData) {
	const data = new OwM(initData);
	let blockchain = null;

	data.embedFile = function (fileAlias, fileData) {
		addInBlockchain("global.EmbeddedFile", fileAlias, (embeddedFile) => {
			if (!embeddedFile.isEmpty()) {
				console.log(`File with alias ${fileAlias} already exists`);
				return;
			}

			embeddedFile.init(fileAlias, fileData);
		});
	};

	data.attachFile = function (fileAlias, path, seed) {
		addInBlockchain("global.FileReference", fileAlias, (file) => {
			if (!file.isEmpty()) {
				console.log(`File with alias ${fileAlias} already exists`);
				return;
			}

			file.init(fileAlias, path, seed);
		});
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

	function addInBlockchain(assetType, aid, assetModifier) {
		if (!blockchain) {
			blockchain = pskdb.startCsbDb({getInitValues, persist});
		}

		const transaction = blockchain.beginTransaction({});
		const asset = transaction.lookup(assetType, aid);

		assetModifier(asset);

		transaction.add(asset);
		blockchain.commit(transaction);
	}

	return data;
}