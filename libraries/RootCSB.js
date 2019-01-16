const RawCSB = require('./RawCSB');
const fs = require('fs');
const path = require('path');
const crypto = require('pskcrypto');
const Seed = require('../utils/Seed');

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

	this.getMidRoot = function (CSBPath) {
		throw new Error("Not implemented");
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
			if (err) {
				return callback(err);
			}

			__saveRawCSB(masterRawCSB, splitPath, rawCSB, (err, persist) => {
				if (err) {
					return callback(err);
				}

				if (persist) {
					if (!dseed) {
						return callback(new Error("Dseed not provided, can't save CSB"));
					}

					__writeRawCSB(masterRawCSB, dseed, callback);
				}
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

				callback(null, newMasterRawCSB);
			})
		} else {
			callback(null, masterRawCSB);
		}
	};

	this.saveMasterRawCSB = function (callback) {
		this.loadMasterRawCSB((err, masterRawCSB) => {
			if(err) {
				return callback(err);
			}

			if(!dseed) {
				return callback(new Error("Dseed not provided, can't save masterRawCSB"));
			}
			__writeRawCSB(masterRawCSB, dseed, callback);
		});
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
			const nextAlias = processedPath.CSBAliases.shift();
			CSBReference = masterRawCSB.getAsset(processedPath.assetType, nextAlias);
		} else {
			CSBReference = masterRawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
		}

		if(processedPath.CSBAliases.length === 0) {
			return callback(null, CSBReference, masterRawCSB);
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
			if (currentIndex < processedPath.CSBAliases.length) {
				const nextAlias = processedPath.CSBAliases[currentIndex];
				let asset = rawCSB.getAsset(processedPath.assetType, nextAlias);
				__loadAssetFromPath(processedPath, Buffer.from(asset.dseed), ++currentIndex, callback);
				return;
			}

			let asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
			callback(null, asset, rawCSB);

		});

	}

	function __saveRawCSB(parentRawCSB, splitPath, rawCSBToSave, callback) {
		if (splitPath.CSBAliases.length === 0) {
			if(!parentRawCSB) {
				return callback(new Error('Invalid CSBPath'));
			}

			parentRawCSB.modifyAsset(splitPath.assetType, splitPath.assetAid, (CSBReference) => {
				let localDseed = null;
				if (CSBReference.isPersisted()) {
					localDseed = Buffer.from(CSBReference.dseed);
				} else {
					const seed = Seed.create(config.backup);
					const localSeed = Seed.generateCompactForm(seed);
					localDseed = Seed.generateCompactForm(Seed.deriveSeed(localSeed));
					CSBReference.init(splitPath.assetAid, localSeed, localDseed);
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
			const nextCSBReference = parentRawCSB.getAsset(splitPath.assetType, nextCSBAlias);
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
				callback(null);
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

function createRootCSB(localFolder, masterRawCSB, masterSeed, masterDseed, pin, callback) {
	if (masterSeed && !masterDseed) {
		masterDseed = Seed.generateCompactForm(masterSeed);
	}

	if(masterRawCSB) {
		const rootCSB = new RootCSB(localFolder, masterRawCSB, masterDseed);
		return callback(null, rootCSB);
	}

	if (pin && !masterDseed) {
		crypto.loadData(pin, path.join(localFolder, '.privatesky', 'Dseed'), (err, diskDseed) => {
			if(err) {
				return callback(err);
			}

			masterDseed = diskDseed;
			const rootCSB = new RootCSB(localFolder, null, masterDseed);
			rootCSB.loadMasterRawCSB((err) => {
				if (err) {
					return callback(err);
				}

				callback(null, rootCSB);
			});
		});
	} else if (masterDseed) {
		const rootCSB = new RootCSB(localFolder, null, masterDseed);
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
	createRootCSB: function (localFolder, masterRawCSB, masterSeed, masterDseed, pin, callback) {
		if (masterSeed && !masterDseed) {
			return this.loadWithSeed(localFolder, masterSeed, callback);
		}

		if (masterRawCSB) {
			const rootCSB = new RootCSB(localFolder, masterRawCSB, masterDseed);
			return callback(null, rootCSB);
		}

		if (pin && !masterDseed) {
			return this.loadWithPin(localFolder, pin, callback);
		} else if (masterDseed) {
			return this.loadWithDseed(localFolder, masterDseed, callback);
		} else {
			callback(new Error('Missing seed, dseed and pin, at least one is required'));
		}
	},
	loadWithPin: function (localFolder, pin, callback) {
		crypto.loadData(pin, path.join(localFolder, '.privatesky', 'Dseed'), (err, diskDseed) => {
			if (err) {
				return callback(err);
			}

			const rootCSB = new RootCSB(localFolder, null, diskDseed);
			rootCSB.loadMasterRawCSB((err) => {
				if (err) {
					return callback(err);
				}

				callback(null, rootCSB);
			});
		});
	},

	loadWithSeed: function (localFolder, masterSeed, callback) {
		const masterDseed = Seed.generateCompactForm(masterSeed);
		this.loadWithDseed(localFolder, masterDseed, callback);
	},
	loadWithDseed: function (localFolder, masterDseed, callback) {
		const rootCSB = new RootCSB(localFolder, null, masterDseed);
		rootCSB.loadMasterRawCSB((err) => {
			if (err) {
				return callback(err);
			}
			callback(null, rootCSB);
		});
	},
	createNew: function(localFolder, masterDseed) {
		return new RootCSB(localFolder, new RawCSB(), masterDseed);
	},
	writeNewMasterCSB: function (localFolder, masterDseed, callback) {
		if (!localFolder || !masterDseed) {
			callback(new Error('Missing required arguments'));
		}

		const rootCSB = new RootCSB(localFolder, new RawCSB(), masterDseed);
		rootCSB.saveMasterRawCSB(callback);
	}
};