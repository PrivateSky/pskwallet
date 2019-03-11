const crypto = require('pskcrypto');
const path = require('path');

function DseedCage(localFolder) {
	const dseedFolder = path.join(localFolder, '.privateSky');
	const dseedPath = path.join(dseedFolder, 'dseed');

	function loadDseedBackups(pin, callback) {
		$$.ensureFolderExists(dseedFolder, (err) => {
			if (err) {
				return callback(err);
			}

			crypto.loadData(pin, dseedPath, (err, dseedBackups) => {
				if (err) {
					return callback(err);
				}

				dseedBackups = JSON.parse(dseedBackups.toString());
				callback(undefined, dseedBackups.dseed, dseedBackups.backups);
			});
		});
	}

	function saveDseedBackups(pin, dseed, backups, callback) {
		// backups = backups || JSON.stringify([]);
		$$.ensureFolderExists(dseedFolder, (err) => {
			if (err) {
				return callback(err);
			}

			const dseedBackups = JSON.stringify({
				dseed,
				backups
			});

			crypto.saveData(Buffer.from(dseedBackups), pin, dseedPath, callback);
		});
	}


	return {
		loadDseedBackups,
		saveDseedBackups,
	};
}


module.exports = DseedCage;