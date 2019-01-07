const RawCSB = require('./RawCSB');
const fs = require('fs');
const path = require('path');
const crypto = require('pskcrypto');
/**
 *
 * @param localFolder  - required
 * @param masterRawCSB - optional
 * @param dseed		   - required
 * @constructor
 */
function RootCSB(localFolder, masterRawCSB, dseed) {

	let config = {
		backup : "http://localhost:8080",
		pin    : "12345678",
		noTries: 3
	};

	this.loadRawCSB = function (CSBPath, callback) {
		if(!CSBPath){
			return callback(null, masterRawCSB);
		}
		this.loadAssetFromPath(CSBPath,  (err, asset) => {
			if(err){
				return callback(err);
			}
			__loadRawCSB(asset.dseed, callback)
		})
	};
	this.saveRawCSB = function (rawCSB, CSBPath, callback) {
		const splitPath = __splitPath(CSBPath);
		this.loadMasterRawCSB((err, masterRawCSB) => {
			if(err) {
				return callback(err);
			}
			__saveRawCSB(masterRawCSB, splitPath, rawCSB, (err, persist) => {
				if(err) {
					return callback(err);
				}


				__writeRawCSB(masterRawCSB, dseed, callback);
			});
		});
	};



	this.loadMasterRawCSB = function (callback) {
		if (!masterRawCSB) {
			__loadRawCSB(dseed, function (err, newMasterRawCSB) {
				if (err) {
					masterRawCSB = new RawCSB();
					return callback(null, masterRawCSB);
				}
				masterRawCSB = newMasterRawCSB;
				callback(null, masterRawCSB);
			})
		} else {
			callback(null, masterRawCSB);
		}
	};

	function __writeRawCSB(rawCSB, localDseed, callback) {
		if(!Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}
		crypto.encryptJson(rawCSB.blockchain, localDseed, null, (err, encryptedBlockchain) => {
			if (err) {
				return callback(err);
			}
			fs.writeFile(__generatePath(localDseed), encryptedBlockchain, (err) => {
				if (err) {
					return callback(err);
				}
				callback();
			});
		});
	}



	this.loadAssetFromPath = function(CSBPath, callback) {
		let processedPath = __splitPath(CSBPath);
		if(!masterRawCSB){
			return callback(new Error('masterRawCSB does not exist'));
		}

		let CSBReference = null;
		if(processedPath.CSBAliases.length > 0) {
			CSBReference = masterRawCSB.getAsset('global.CSBReference', processedPath.CSBAliases.shift());
		} else {
			CSBReference = masterRawCSB.getAsset('global.CSBReference', processedPath.assetAid);
		}

		if(processedPath.CSBAliases.length === 0) {
			return callback(null, CSBReference);
		}
		__loadAssetFromPath(processedPath, Buffer.from(CSBReference.dseed), 0, callback);
	};



	//internal functions
	function __generatePath(dseed) {
		if(dseed && !Buffer.isBuffer(dseed)){
			dseed = Buffer.from(dseed, "hex");
		}
		const filePath = path.join(localFolder, crypto.generateSafeUid(dseed, localFolder));
		return filePath;
	}

	function __loadRawCSB(localDseed, callback) {
		if(localDseed && !Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}
		let dseedHash = crypto.generateSafeUid(localDseed, localFolder);
		let cachedRawCSB = rawCSBCache.load(dseedHash);
		if(cachedRawCSB) {
			return callback(null, cachedRawCSB);
		}
		let rootPath = __generatePath(localDseed);
		fs.readFile(rootPath, function (err, encryptedCsb) {
			if (err) {
				return callback(new Error(err.message));
			}

			crypto.decryptJson(encryptedCsb, localDseed, function (err, csbData) {
				if (err) {
					return callback(err);
				}

				let csb = new RawCSB(csbData);
				rawCSBCache.put(dseedHash, csb);
				callback(null, csb);
			});
		})
	}

	/**
	 *
	 * @param CSBPath: string - internal path that looks like /{CSBName1}/{CSBName2}:{assetType}:{assetAliasOrId}
	 * @param options:object
	 * @returns {{CSBAliases: [string], assetAid: (*|undefined), assetType: (*|undefined)}}
	 * @private
	 */
	function __splitPath(CSBPath, options = {}){
		const pathSeparator = '/';

		if(CSBPath.startsWith(pathSeparator)) {
			CSBPath = CSBPath.substring(1);
		}

		let CSBAliases = CSBPath.split(pathSeparator);
		if(CSBAliases.length < 1) {
			throw new Error('CSBPath too short');
		}

		const lastIndex = CSBAliases.length - 1;
		const optionalAssetSelector = CSBAliases[lastIndex].split(':');
		CSBAliases[lastIndex] = optionalAssetSelector[0];

		if(!optionalAssetSelector[1] && !optionalAssetSelector[2]) {
			optionalAssetSelector[1] = 'global.CSBReference';
			optionalAssetSelector[2] = CSBAliases[lastIndex];
			CSBAliases.pop();
		}

		if(options.keepAliasesAsString === true) {
			CSBAliases = CSBAliases.join('/')
		}
		return {
			CSBAliases: CSBAliases,
			assetType: optionalAssetSelector[1],
			assetAid: optionalAssetSelector[2]
		};
	}

	function __loadAssetFromPath(processedPath, localDseed, currentIndex, callback) {
		if(!Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}
		__loadRawCSB(localDseed, function (err, rawCSB) {
			if (err) {
				return callback(err);
			}
			if (currentIndex < processedPath.CSBAliases.length - 1) {
				let asset = rawCSB.getAsset('global.CSBReference', processedPath.CSBAliases[currentIndex]);
				__loadAssetFromPath(processedPath, Buffer.from(asset.dseed), ++currentIndex, callback);
				return;
			}

			let asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
			callback(null, asset);

		});

	}

	function __saveRawCSB(parentRawCSB, splitPath, rawCSBToSave, callback) {
		if (splitPath.CSBAliases.length === 0) {
			if(!parentRawCSB) {
				return callback(new Error('Invalid CSBPath'));
			}

			parentRawCSB.modifyAsset('global.CSBReference', splitPath.assetAid, (CSBReference) => {
				let localDseed = null;
				if (CSBReference.isPersisted()) {
					localDseed = Buffer.from(CSBReference.dseed);
				} else {
					const seed = crypto.generateSeed();
					localDseed = crypto.deriveSeed(seed);
					CSBReference.init(splitPath.assetAid, seed, localDseed);
				}

				__writeRawCSB(rawCSBToSave, localDseed, (err) => {
					if (err) {
						return callback(err);
					}

					callback(null, true, parentRawCSB);
				});
			});
		} else {
			const nextCSBAlias = splitPath.CSBAliases.shift();
			const nextCSBReference = parentRawCSB.getAsset('global.CSBReference', nextCSBAlias);
			__loadRawCSB(Buffer.from(nextCSBReference.dseed), (err, nextRawCSB) => {
				if(err) {
					return callback(err);
				}
				__saveRawCSB(nextRawCSB, splitPath, rawCSBToSave, (err, persist) => {
					if(err) {
						return callback(err);
					}

					if (persist) {
						__writeRawCSB(nextRawCSB, Buffer.from(nextCSBReference.dseed), callback);
					}
				});
			});
		}
	}
}


function GenericCache(size) {

	let cache = {};

	this.load = function (uid) {
		return cache[uid];
	};

	this.put = function (uid, obj) {
		cache[uid] = obj;
	}

}

function createRootCSB(localFolder, masterRawCSB, seed, dseed, pin, callback) {
	if (seed && !dseed) {
		dseed = crypto.deriveSeed(seed);
	}

	if (pin && !dseed) {
		crypto.loadDseed(pin, path.join(localFolder, 'dseed'), (err, diskDseed) => {
			dseed = diskDseed;
			const rootCSB = new RootCSB(localFolder, null, dseed);
			rootCSB.loadMasterRawCSB((err) => {
				if (err) {
					return callback(err);
				}
				callback(null, rootCSB);
			});
		});
	} else if (dseed) {
		const rootCSB = new RootCSB(localFolder, null, dseed);
		rootCSB.loadMasterRawCSB((err) => {
			if (err) {
				return callback(err);
			}
			callback(null, rootCSB);
		});
	} else {
		callback(new Error('Missing seed, dseed and pin, at least one is required'));
	}
}

let rawCSBCache = new GenericCache(10);
module.exports = {
	createRootCSB
};