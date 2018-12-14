const RawCSB = require('./RawCSB');
const fs = require('fs');
const path = require('path');
const crypto = require('pskcrypto');
/**
 *
 * @param localFolder  - required
 * @param masterRawCSB - optional
 * @param seed		   - optional
 * @param dseed		   - optional
 * @param pin		   - optional
 * @constructor
 */
function RootCSB(localFolder, masterRawCSB, seed, dseed, pin) {

	let config = {
		backup : "http://localhost:8080",
		pin    : "12345678",
		noTries: 3
	};

	this.loadRawCSB = function (CSBPath, callback) {
		this.loadAssetFromPath(CSBPath,  (err, asset) => {
			if(err){
				return callback(err);
			}
			__loadRawCSB(asset.dseed, callback)
		})
	};

	this.saveRawCSB = function (callback) {
		crypto.encryptJson(masterRawCSB.blockchain, dseed, null, (err, encryptedBlockchain) => {
			if(err){
				return callback(err);
			}
			fs.writeFile(path.join(localFolder, __generatePath(dseed)), encryptedBlockchain, (err) => {
				if(err){
					return callback(err);
				}
				callback(null);
			})
		});
	};


	this.loadMasterRawCSB = function (callback) {
		if (!masterRawCSB) {
			__loadRawCSB(dseed, function (err, newMasterRawCSB) {
				if (err) {
					return callback(err);
				}
				masterRawCSB = newMasterRawCSB;
				callback(null, masterRawCSB);
			})
		} else {
			callback(null, masterRawCSB);
		}
	};

	this.loadAssetFromPath = function(CSBPath, callback) {
		let processedPath = __splitPath(CSBPath);
		__loadAssetFromPath(processedPath, dseed, 0, callback);
	};



	//internal functions
	function __generatePath(dseed) {
		if (typeof dseed === "string") {
			dseed = Buffer.from(dseed, "hex");
		}
		return path.join(localFolder, crypto.generateSafeUid(dseed, localFolder));
	}

	function __loadRawCSB(dseed, callback) {
		let dseedHash = crypto.generateSafeUid(dseed, localFolder);
		let cachedRawCSB = rawCSBCache.load(dseedHash);
		if(cachedRawCSB) {
			return cachedRawCSB;
		}

		let rootPath = __generatePath(dseed);
		fs.readFile(rootPath, function (err, encryptedCsb) {
			if (err) {
				return callback(err);
			}
			crypto.decryptJson(encryptedCsb, dseed, function (err, csbData) {
				if (err) {
					return callback(err);
				}

				let csb = new RawCSB(csbData);
				cachedRawCSB.put(dseedHash, csb);
				callback(null, csb);
			});
		})
	}

	function __splitPath(CSBPath){
		let pathArr = CSBPath.split("/");
		if(pathArr.length < 2){
			throw new Error("Invalid CSBPath")
		}
		return {
			CSBAliases  : pathArr.slice(0, pathArr.length-2),
			assetAid : pathArr.pop(),
			assetType: pathArr.pop()
		}
	}

	function __loadAssetFromPath(processedPath, dseed, currentIndex, callback) {

		__loadRawCSB(dseed, function (err, rawCSB) {
			if (err) {
				return callback(err);
			}
			if (currentIndex < processedPath.CSBAliases.length - 1) {
				let asset = rawCSB.getAsset('CSBReference', processedPath.CSBAliases[currentIndex]);

				__loadAssetFromPath(processedPath, asset.dseed, ++currentIndex, callback);
				return;
			}

			let asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
			callback(null, asset);

		});

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

let rawCSBCache = new GenericCache(10);
module.exports = RootCSB;