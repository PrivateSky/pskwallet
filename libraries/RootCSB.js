const RawCSB = require('./RawCSB');
const fs = require('fs');
const path = require('path');
const crypto = require('pskcrypto');
const Seed = require('../utils/Seed');
const utils = require('../utils/utils');
const DseedCage = require('../utils/DseedCage');
const HashCage = require('../utils/HashCage');

/**
 *
 * @param localFolder  - required
 * @param masterRawCSB - optional
 * @param dseed		   - required
 * @constructor
 */
function RootCSB(localFolder, masterRawCSB, dseed) {

	let config = {
		backup : ["http://localhost:8080"],
		pin    : "12345678",
		noTries: 3
	};

	const hashCage = new HashCage(localFolder);

	this.getMidRoot = function (CSBPath) {
		throw new Error("Not implemented");
	};

	this.loadRawCSB = function (CSBPath, callback) {
		if(!CSBPath){
			return callback(null, masterRawCSB);
		}
		this.loadAssetFromPath(CSBPath,  (err, asset, rawCSB) => {
			if(err){
				return callback(err);
			}
			__loadRawCSB(asset.dseed, callback)
		})
	};

	this.saveRawCSB = function (rawCSB, CSBPath, callback) {
		const splitPath = __splitPath(CSBPath);

		let hashObj = {};

		hashCage.loadHash((err, hash) => {
			if(!err){
				hashObj = hash;
			}

			this.loadMasterRawCSB((err, masterRawCSB) => {
				if (err) {
					return callback(err);
				}

				__saveRawCSB(masterRawCSB, splitPath, rawCSB, hashObj, (err, persist) => {
					if (err) {
						return callback(err);
					}

					if (persist) {
						if (!dseed) {
							return callback(new Error("Dseed not provided, can't save CSB"));
						}

						__writeRawCSB(masterRawCSB, dseed, hashObj, (err) => {
							if(err){
								return callback(err);
							}

							hashCage.saveHash(hashObj, callback);
						});
					} else {
						callback();
					}
				});
			});
		});
	};



	this.loadMasterRawCSB = function (callback) {
		if (!masterRawCSB) {
			if(!dseed) {
				return callback(new Error("Dseed not provided, can't load masterRawCSB"));
			}

			__loadRawCSB(dseed, function (err, newMasterRawCSB) {
				if (err) {
					return callback(err);
				}

				masterRawCSB = newMasterRawCSB;
				callback(null, newMasterRawCSB);
			})
		} else {
			callback(null, masterRawCSB);
		}
	};

	this.saveMasterRawCSB = function (callback) {
		let hashObj = {};
		const hashCage = new HashCage(localFolder);
		hashCage.loadHash((err, hash) => {
			if(!err){
				hashObj = hash;
			}

			this.loadMasterRawCSB((err, masterRawCSB) => {
				if(err) {
					return callback(err);
				}

				if(!dseed) {
					return callback(new Error("Dseed not provided, can't save masterRawCSB"));
				}
				__writeRawCSB(masterRawCSB, dseed, hashObj, (err) => {
					if(err){
						return callback(err);
					}

					hashCage.saveHash(hashObj, callback);
				});
			});
		})
	};

	this.saveAssetToPath = function (CSBPath, asset, callback) {
		const splitPath = __splitPath(CSBPath, {keepAliasesAsString: true});
		this.loadRawCSB(splitPath.CSBAliases, (err, rawCSB) => {
			if(err) {
				return callback(err);
			}
			rawCSB.saveAsset(asset);
			this.saveRawCSB(rawCSB, splitPath.CSBAliases, callback);
		});
	};

	this.loadAssetFromPath = function(CSBPath, callback) {
		let processedPath = __splitPath(CSBPath);
		if(!masterRawCSB){
			return callback(new Error('masterRawCSB does not exist'));
		}

		let CSBReference = null;
		if(processedPath.CSBAliases.length > 0) {
			const nextAlias = processedPath.CSBAliases[0];
			CSBReference = masterRawCSB.getAsset('global.CSBReference', nextAlias);
		} else {
			CSBReference = masterRawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
		}

		if(processedPath.CSBAliases.length === 0) {
			return callback(null, CSBReference, masterRawCSB);
		}
		processedPath.CSBAliases.shift();
		__loadAssetFromPath(processedPath, Buffer.from(CSBReference.dseed), 0, callback);
	};


	//internal functions

	function __loadRawCSB(localDseed, callback) {
		if(localDseed && !Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}
		let dseedHash = crypto.generateSafeUid(localDseed);
		let cachedRawCSB = rawCSBCache.load(dseedHash);
		if(cachedRawCSB) {
			return callback(null, cachedRawCSB);
		}
		let rootPath = utils.generatePath(localFolder, localDseed);
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
		__loadRawCSB(localDseed,  (err, rawCSB) =>{
			if (err) {
				return callback(err);
			}
			if (currentIndex < processedPath.CSBAliases.length) {
				const nextAlias = processedPath.CSBAliases[currentIndex];
				let asset = rawCSB.getAsset("global.CSBReference", nextAlias);
				__loadAssetFromPath(processedPath, Buffer.from(asset.dseed), ++currentIndex, callback);
				return;
			}

			let asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
			callback(null, asset, rawCSB);

		});

	}

	function __saveRawCSB(parentRawCSB, splitPath, rawCSBToSave, hashObj, callback) {
		if (splitPath.CSBAliases.length === 0) {
			if (!parentRawCSB) {
				return callback(new Error('Invalid CSBPath'));
			}

			const CSBReference = parentRawCSB.getAsset(splitPath.assetType, splitPath.assetAid);
			let localDseed = null;

			if (CSBReference.isPersisted()) {
				localDseed = Buffer.from(CSBReference.dseed);
			} else {
				const seed = Seed.create(config.backup);
				const localSeed = Seed.generateCompactForm(seed);
				localDseed = Seed.generateCompactForm(Seed.deriveSeed(localSeed));
				CSBReference.init(splitPath.assetAid, localSeed, localDseed);
				parentRawCSB.saveAsset(CSBReference);
			}

			__writeRawCSB(rawCSBToSave, localDseed, hashObj, (err) => {
				if (err) {
					return callback(err);
				}

				callback(null, true, parentRawCSB);
			});
		} else {
			const nextCSBAlias = splitPath.CSBAliases.shift();
			const nextCSBReference = parentRawCSB.getAsset(splitPath.assetType, nextCSBAlias);
			__loadRawCSB(Buffer.from(nextCSBReference.dseed), (err, nextRawCSB) => {
				if(err) {
					return callback(err);
				}
				__saveRawCSB(nextRawCSB, splitPath, rawCSBToSave, hashObj,(err, persist) => {
					if(err) {
						return callback(err);
					}

					if (persist) {
						__writeRawCSB(nextRawCSB, Buffer.from(nextCSBReference.dseed), hashObj, (err) => {
							if(err){
								return callback(err);
							}

							hashCage.saveHash(hashObj, callback);
						});

					} else {
						callback();
					}
				});
			});
		}
	}

	function __writeRawCSB(rawCSB, localDseed, hashObj, callback) {
		if(!Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}
		crypto.encryptJson(rawCSB.blockchain, localDseed, null, (err, encryptedBlockchain) => {
			if (err) {
				return callback(err);
			}
			fs.writeFile(utils.generatePath(localFolder,localDseed), encryptedBlockchain, (err) => {
				if (err) {
					return callback(err);
				}
				const key = crypto.generateSafeUid(localDseed);
				hashObj[key] = crypto.pskHash(encryptedBlockchain).toString('hex');
				callback();
			});
		});
	}
}


function GenericCache(size) {

	let cache = {};

	this.load = function (uid) {
		return undefined;
		// return cache[uid];
	};

	this.put = function (uid, obj) {
		cache[uid] = obj;
	}

}

let rawCSBCache = new GenericCache(10);

function createRootCSB(localFolder, masterRawCSB, masterSeed, masterDseed, pin, callback) {
	if (masterSeed && !masterDseed) {
		return loadWithSeed(localFolder, masterSeed, callback);
	}

	if (masterRawCSB) {
		const rootCSB = new RootCSB(localFolder, masterRawCSB, masterDseed);
		return callback(null, rootCSB);
	}

	if (masterDseed) {
		return loadWithDseed(localFolder, masterDseed, callback);
	} else if (pin) {
		return loadWithPin(localFolder, pin, callback);
	} else {
		callback(new Error('Missing seed, dseed and pin, at least one is required'));
	}
}
function loadWithPin(localFolder, pin, callback) {
	new DseedCage(localFolder).loadDseed(pin, (err, diskDseed) => {
		if (err) {
			return callback(err);
		}

		const rootCSB = new RootCSB(localFolder, null, diskDseed);
		rootCSB.loadMasterRawCSB((err) => {
			if (err) {
				return callback(err);
			}

			callback(null, rootCSB, diskDseed);
		});
	});
}

function loadWithSeed(localFolder, masterSeed, callback) {
	const masterDseed = Seed.deriveSeed(masterSeed);
	loadWithDseed(localFolder, masterDseed, callback);
}

function loadWithDseed(localFolder, masterDseed, callback) {
	if(typeof masterDseed === 'object') {
		masterDseed = Seed.generateCompactForm(masterDseed);
	}
	const rootCSB = new RootCSB(localFolder, null, masterDseed);
	rootCSB.loadMasterRawCSB((err) => {
		if (err) {
			return callback(err);
		}
		callback(null, rootCSB);
	});
}

function createNew(localFolder, masterDseed) {
	return new RootCSB(localFolder, new RawCSB(), masterDseed);
}

function writeNewMasterCSB(localFolder, masterDseed, callback) {
	if (!localFolder || !masterDseed) {
		callback(new Error('Missing required arguments'));
	}

	const rootCSB = new RootCSB(localFolder, new RawCSB(), masterDseed);
	rootCSB.saveMasterRawCSB(callback);
}
module.exports = {
	createNew,
	createRootCSB,
	loadWithDseed,
	loadWithPin,
	loadWithSeed,
	writeNewMasterCSB
};