const path = require('path');
const fs = require('fs');

function HashCage(localFolder) {
	const hashFolder = path.join(localFolder, '.privateSky');
	const hashPath = path.join(hashFolder, 'hash');

	function loadHash(callback) {
		$$.ensureFolderExists(hashFolder, (err) => {
			if (err) {
				return callback(err);
			}

			fs.readFile(hashPath, (err, data) => {
				if(err){
					return callback(err);
				}

				callback(null, JSON.parse(data));
			});

		});
	}

	function saveHash(hashObj, callback) {
		$$.ensureFolderExists(hashFolder, (err) => {
			if (err) {
				return callback(err);
			}

			fs.writeFile(hashPath, JSON.stringify(hashObj), (err) => {
				if (err) {
					return callback(err);
				}
				callback();
			});
		});
	}

	return {
		loadHash,
		saveHash
	};
}