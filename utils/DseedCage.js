const crypto = require('pskcrypto');
const path = require('path');

function DseedCage(localFolder) {
	const dseedFolder = path.join(localFolder, '.privateSky');
	const dseedPath = path.join(dseedFolder, 'dseed');

	function loadDseed(pin, callback) {
		$$.ensureFolderExists(dseedFolder, (err) => {
			if (err) {
				return callback(err);
			}

			crypto.loadData(pin, dseedPath, callback);
		});
	}

	function saveDseed(pin, dseed, callback) {
		$$.ensureFolderExists(dseedFolder, (err) => {
			if (err) {
				return callback(err);
			}

			crypto.saveData(dseed, pin, dseedPath, callback);
		});
	}

	return {
		loadDseed,
		saveDseed
	};
}


module.exports = DseedCage;