const RawCSB = require('./RawCSB');
const fs = require('fs');
const crypto = require('pskcrypto');
const Seed = require('../utils/Seed');
const utils = require('../utils/utils');
const DseedCage = require('../utils/DseedCage');
const HashCage  = require('../utils/HashCage');


/**
 *
 * @param localFolder   - required
 * @param currentRawCSB - optional
 * @param dseed		    - required
 * @constructor
 */
function RootCSB(localFolder, currentRawCSB, dseed) {
	if(!localFolder || !dseed) {
		throw new Error('Missing required parameters');
	}

	let config = {
		backup : ["http://localhost:8080"],
		pin    : "12345678",
		noTries: 3
	};

	const hashCage = new HashCage(localFolder);
	
	this.getMidRoot = function (CSBPath, callback) {
		throw new Error('Not implemented');
	};

	this.loadRawCSB = function (CSBPath, callback) {
		if (!currentRawCSB) {
			__loadRawCSB(dseed, (err, rawCSB) => {
				if (err) {
					return callback(err);
				}

				currentRawCSB = rawCSB;

				if (CSBPath || CSBPath !== '') {
					this.loadRawCSB(CSBPath, callback);
					return;
				}

				callback(undefined, currentRawCSB);
			});
			return;
		}

		if (!CSBPath || CSBPath === '') {
			return callback(null, currentRawCSB);
		}

		this.loadAssetFromPath(CSBPath, (err, asset, rawCSB) => {
			if (err) {
				return callback(err);
			}
			__loadRawCSB(asset.dseed, callback)
		})
	};

	this.saveRawCSB = function (rawCSB, CSBPath, callback) {
		// save master
		if(!CSBPath || CSBPath === '') {
			if(rawCSB) {
				currentRawCSB = rawCSB;
			}

			const csbMeta = currentRawCSB.getAsset('global.CSBMeta', 'meta');
			if(!csbMeta.id) {
				csbMeta.init($$.uidGenerator.safe_uuid(), true);
				currentRawCSB.saveAsset(csbMeta);
			}

			return __writeRawCSB(currentRawCSB, dseed, callback);
		}

		// save csb in hierarchy
		const splitPath = __splitPath(CSBPath);
		this.loadAssetFromPath(CSBPath, (err, csbReference) => {
			if(err) {
				callback(err);
			}
			if(!csbReference.dseed) {
				const seed = Seed.create(config.backup);
				const localSeed = Seed.generateCompactForm(seed);
				const localDseed = Seed.generateCompactForm(Seed.deriveSeed(localSeed));
				csbReference.init(splitPath.assetAid, localSeed, localDseed);

				this.saveAssetToPath(CSBPath, csbReference, (err) => {
					if(err) {
						return callback(err);
					}

					this.loadAssetFromPath(CSBPath, (err, csbRef) => {
						if(err) {
							return callback(err);
						}
						const asset = rawCSB.getAsset("global.CSBMeta", "meta");
						asset.init(csbRef.getMetadata('swarmId'), false);
						rawCSB.saveAsset(asset);
						__writeRawCSB(rawCSB, csbReference.dseed, callback);
					});
				});
			} else {
				__writeRawCSB(rawCSB, csbReference.dseed, callback);
			}
		});
	};

	this.saveAssetToPath = function (CSBPath, asset, callback) {
		const splitPath = __splitPath(CSBPath, {keepAliasesAsString: true});
		this.loadRawCSB(splitPath.CSBAliases, (err, rawCSB) => {
			if(err) {
				return callback(err);
			}
			try {
				rawCSB.saveAsset(asset);
				this.saveRawCSB(rawCSB, splitPath.CSBAliases, callback);
			}catch (e) {
				callback(e);
			}
		});
	};

	this.loadAssetFromPath = function(CSBPath, callback) {
		let processedPath = __splitPath(CSBPath);

		if(!currentRawCSB){
			return callback(new Error('currentRawCSB does not exist'));
		}

		let CSBReference = null;
		if(processedPath.CSBAliases.length > 0) {
			const nextAlias = processedPath.CSBAliases[0];
			CSBReference = currentRawCSB.getAsset('global.CSBReference', nextAlias);
		} else {
			if(!processedPath.assetType || !processedPath.assetAid) {
				return callback(new Error('Not asset type or id specified in CSBPath'));
			}

			CSBReference = currentRawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
		}

		if(processedPath.CSBAliases.length === 0) {
			return callback(null, CSBReference, currentRawCSB);
		}
		processedPath.CSBAliases.shift();
		__loadAssetFromPath(processedPath, Buffer.from(CSBReference.dseed), 0, callback);
	};


	/* ------------------- INTERNAL METHODS ------------------- */

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

			crypto.decryptObject(encryptedCsb, localDseed, function (err, csbData) {
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

		if(optionalAssetSelector[0] === '') {
			CSBAliases = [];
		} else {
			CSBAliases[lastIndex] = optionalAssetSelector[0];
		}

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

	function __writeRawCSB(rawCSB, localDseed, callback) {
		if(!Buffer.isBuffer(localDseed)){
			localDseed = Buffer.from(localDseed);
		}



		crypto.encryptObject(rawCSB.blockchain, localDseed, null, (err, encryptedBlockchain) => {
			if (err) {
				return callback(err);
			}
			hashCage.loadHash((err, hashObj) => {
				if(err){
					return callback(err);
				}
				
				const key = crypto.generateSafeUid(localDseed);
				hashObj[key] = crypto.pskHash(encryptedBlockchain).toString('hex');

				hashCage.saveHash(hashObj, (err) => {
					if(err){
						return callback(err);
					}

					fs.writeFile(utils.generatePath(localFolder,localDseed), encryptedBlockchain, callback);
				});
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
		rootCSB.loadRawCSB('', (err) => {
			if(err){
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
	if(typeof masterDseed === 'object' && !Buffer.isBuffer(masterDseed)) {
		masterDseed = Seed.generateCompactForm(masterDseed);
	}
	const rootCSB = new RootCSB(localFolder, null, masterDseed);
	rootCSB.loadRawCSB('',(err) => {
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

	const rootCSB = new RootCSB(localFolder, null, masterDseed);
	rootCSB.saveRawCSB(new RawCSB(), '',callback);
}
module.exports = {
	createNew,
	createRootCSB,
	loadWithDseed,
	loadWithPin,
	loadWithSeed,
	writeNewMasterCSB
};