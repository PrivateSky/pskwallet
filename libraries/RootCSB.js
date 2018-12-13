const RawCSB = require('./RawCSB');
const fs = require('fs');
const path = require('path');

/**
 *
 * @param localFolder  - required
 * @param masterRawCSB - optional
 * @param seed		   - optional
 * @param dseed		   - optional
 * @param pin		   - optional
 * @constructor
 */
function RootCSB(localFolder, masterRawCSB, seed, dseed, pin ) {

	let config = {
		backup : "http://localhost:8080",
		pin    : "12345678",
		noTries: 3
	};


	this.loadRawCSB = function (CSBPath, callback) {
		__readCSBData(dseed, function (err, CSBData) {
			if(err){
				return callback(err);
			}
			callback(null, new RawCSB(CSBData));
		})
	};

	this.saveRawCSB = function (rawCSB, CSBPath, callback) {

	};

	this.loadMasterRawCSB = function (callback) {
		if (!masterRawCSB) {
			__readCSBData(dseed, function (err, masterCSBData) {
				if (err) {
					return callback(err);
				}
				masterRawCSB = new RawCSB(masterCSBData);
				callback(null, masterRawCSB);
			})
		} else {
			callback(null, masterRawCSB);
		}
	};

	this.getAssetFromPath = function(CSBPath, callback) {
		__readCSBData(dseed, function (err, CSBData) {
			if(err){
				return callback(err);
			}
			let rawCSB = new RawCSB(CSBData);

		})
	};

	function splitPath(CSBPath){
		let pathArr = CSBPath.split("/");
		if(pathArr.length < 2){
			throw new Error("Invalid CSBPath")
		}
		return {
			CSBAids  : pathArr.slice(0, pathArr.length-2),
			assetAid : pathArr.pop(),
			assetType: pathArr.pop()
		}
	}

	function traversePath(processedPath, dseed, currentIndex, callback) {

		__readCSBData(dseed, function (err, CSBData) {
			if (err) {
				return callback(err);
			}
			let rawCSB = new RawCSB(CSBData);
			if(currentIndex === processedPath.CSBAids.length-1){
				let asset = rawCSB.getAsset('', )
			}
			let asset = rawCSB.getAsset('CSBReference', )

		});

		if (processedPath.CSBAids.length !== 0) {

		}

		if(processedPath.CSBAids.length === 0){

			callback(null, )
		}

		__readCSBData(dseed, function (err, CSBData) {
			if(err){
				return callback(err);
			}
			let rawCSB = new RawCSB(CSBData);
			let asset = rawCSB.getAsset()

		});

	}

	//internal functions
	function generatePath(dseed) {
		if (typeof dseed === "string") {
			dseed = Buffer.from(dseed, "hex");
		}
		return path.join(process.cwd(), crypto.generateSafeUid(dseed, localFolder));
	}

	function __readCSBData(dseed, callback) {
		let rootPath = generatePath(dseed);
		fs.readFile(rootPath, function (err, encryptedCsb) {
			if (err) {
				return callback(err);
			}
			crypto.decryptJson(encryptedCsb, dseed, function (err, csbData) {
				if (err) {
					return callback(err);
				}

				let csb = new RawCSB(csbData);
				callback(null, csb);
			});
		})
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