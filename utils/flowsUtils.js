const crypto = require("pskcrypto");
const fs = require("fs");
const path = require("path");


exports.defaultBackup = "http://localhost:8080";

exports.defaultPin = "12345678";

exports.Paths = {
	"auxFolder"          : path.join(process.cwd(), ".privateSky"),
	"Dseed"             : path.join(process.cwd(), ".privateSky", "Dseed"),
	"Adiacent"          : path.join(process.cwd(), "Adiacent")
};

exports.checkPinIsValid = function(pin, callback) {

	exports.loadMasterCsb(pin, null, function (err, csb) {
		if(err){
			callback(err, false);
		}else{
			callback(null, true);
		}
	});

};

exports.checkSeedIsValid = function(seed, callback) {
	var dseed = crypto.deriveSeed(Buffer.from(seed, "base64"));
	fs.readFile(exports.getMasterPath(dseed), function (err, encryptedMaster) {
		try{
			crypto.decryptJson(encryptedMaster, dseed);
		}catch(err){
			callback(err, false);
		}
		callback(null, true);
	});

};



exports.defaultCSB = function() {
	return {
		"version": 1,
		"protocolVersion": 1,
		"backups": [],
		"records": {}
	};
};

exports.masterCsbExists = function (callback) {
	fs.access(exports.Paths.Dseed, function (err) {
		if(err){
			callback(err, false);
		}else{
			callback(null, true);
		}
	});
};

exports.loadMasterCsb = function(pin, seed, callback){
	pin = pin || exports.defaultPin;
	var readMaster = function (dseed, callback) {
		var masterPath = exports.getMasterPath(dseed);
		fs.readFile(masterPath, function (err, encryptedCsb) {
			if(err){
				callback(err);
			}else{
				var csbData = crypto.decryptJson(encryptedCsb, dseed);
				var csb = {
					"Dseed"  : dseed,
					"Data": csbData,
					"Path"  : exports.getMasterPath(dseed),
					"Uid"   : exports.getMasterUid(dseed)
				};
				callback(null, csb);
			}
		})
	};
	if(seed){
		var dseed = crypto.deriveSeed(seed);
		readMaster(dseed, callback);
	}else {
		crypto.loadDseed(pin, exports.Paths.Dseed, function (err, dseed) {
			readMaster(dseed, callback);
		});
	}

};

exports.writeCsbToFile = function (csbPath, csbData, dseed, callback) {
	if(typeof dseed === "string"){
		dseed = Buffer.from(dseed, "hex");
	}
	fs.writeFile(csbPath, crypto.encryptJson(csbData, dseed), function (err) {
		callback(err);
	})
};

exports.getRecordStructure = function (recordType, callback) {
    let recordTypeData = require("./recordStructures/index")[recordType];
    callback(null, recordTypeData);
};

exports.readEncryptedCsb = function (pathCsb, callback) {
	fs.readFile(pathCsb, null, function (err, data) {
		callback(err, data);
	});
};

exports.readDecryptedCsb = function (pathCsb, dseed, callback) {
	if(typeof dseed === "string"){
		dseed = Buffer.from(dseed, "hex");
	}
	exports.readEncryptedCsb(pathCsb, function (err, encryptedCsb) {
		if(err){
			callback(err);
		}else{
			callback(null, crypto.decryptJson(encryptedCsb, dseed));
		}
	});
};

exports.getMasterPath = function(dseed){
	if(typeof dseed === "string"){
		dseed = Buffer.from(dseed, "hex");
	}
	return path.join(exports.Paths.auxFolder, crypto.generateSafeUid(dseed, exports.Paths.auxFolder));
};

exports.getMasterUid = function (dseed){
	return crypto.generateSafeUid(dseed, exports.Paths.auxFolder)
};

exports.findCsb = function (csbData, aliasCsb, callback) {
	if(!csbData || !csbData["records"] || !csbData["records"]["Csb"] || csbData["records"]["Csb"].length === 0){
		return callback(new Error("Csb empty"));
	}
	var csbs = csbData["records"]["Csb"];
	while(csbs.length > 0){
		var csb = csbs.shift();
		if(csb["Title"] === aliasCsb){
			return callback(null, csb);
		}else{
			exports.readDecryptedCsb(csb["Path"], Buffer.from(csb["Dseed"], "hex"), function (err, childCsb) {
				if(!err){
					if(childCsb && childCsb["records"] && childCsb["records"]["Csb"]){
						csbs = csbs.concat(childCsb["records"]["Csb"]);
					}
				}
			});
		}
	}

};

exports.getCsb = function (pin, aliasCsb, callback) {
	exports.loadMasterCsb(pin, null, function (err, masterCsb) {
		if(!err){
			if(!masterCsb.Data || !masterCsb.Data["records"]){
				callback(new Error("Master csb is empty"));
				return;
			}
			exports.findCsb(masterCsb.Data, aliasCsb, function (err, csbInMaster) {
				if(err){
					callback(err);
					return;
				}
				if(csbInMaster){
					exports.readEncryptedCsb(csbInMaster["Path"], function (err, encryptedCsb) {
						if(err){
							callback(err);
							return;
						}
						var dseed = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
						var csbData = crypto.decryptJson(encryptedCsb, dseed);
						var csb = {
							"Data": csbData,
							"Dseed": dseed,
							"Path": csbInMaster["Path"]
						};
						callback(null, csb);
					});

				}
			});
		}
	});
};

exports.indexOfRecord = function(csbData, recordType, recordKey) {
	if(csbData && csbData["records"] && csbData["records"][recordType]){
		var recordsArray = csbData["records"][recordType];
		for(var c in recordsArray){
			if(recordsArray[c]["Title"] === recordKey){
				return c;
			}
		}
	}
	return -1;
};
exports.indexOfKey = function(arr, property, key){
	for(var i in arr){
		if(arr[i][property] === key){
			return i;
		}
	}
	return -1;
};

exports.getRecord = function (csb, recordType, key, field) {
	var indexKey = exports.indexOfKey(csb.Data["records"][recordType], "Title", key);
	if (indexKey >= 0) {
		if (!field) {
			return csb.Data["records"][recordType][indexKey];
		} else if (csb.Data["records"][recordType][indexKey][field]) {
			return csb.Data["records"][recordType][indexKey][field];
		} else {
			return undefined;
		}
	} else {
		return undefined;
	}
};

exports.getChildCsb = function (parentCsb, aliasChildCsb, callback) {
	var indexChild = exports.indexOfRecord(parentCsb.Data, "Csb", aliasChildCsb);
	if(indexChild >= 0){
		let childCsbPath = parentCsb.Data["records"]["Csb"][indexChild]["Path"];
		let childCsbDseed = Buffer.from(parentCsb.Data["records"]["Csb"][indexChild]["Dseed"], "hex");
		exports.readDecryptedCsb(childCsbPath, childCsbDseed, function (err, csbData) {
			if(err){
				callback(err);
			}else{
				let childCsb = {
					"Title": aliasChildCsb,
					"Dseed": childCsbDseed,
					"Path" : childCsbPath,
					"Data" : csbData
				};
				callback(null, childCsb);
			}
		});
	}
};

function traverseUrlRecursively(pin, csb, splitUrl, lastAlias, parentCsb, callback) {
	var record = splitUrl[0];
	var index = exports.indexOfRecord(csb.Data, "Csb", record);
	if(index < 0){
		splitUrl.unshift(lastAlias);
		splitUrl.unshift(parentCsb);
		callback(null, splitUrl);
	}else {
		if (csb.Data["records"]) {
			let childCsbDseed = Buffer.from(csb.Data["records"]["Csb"][index]["Dseed"], "hex");
			let childCsbPath  = csb.Data["records"]["Csb"][index]["Path"];
			exports.readDecryptedCsb(childCsbPath, childCsbDseed, function (err, childCsbData) {
				if(err){
					callback(err);
				}else{
					var childCsb = {
						"Dseed": childCsbDseed,
						"Path" : childCsbPath,
						"Data" : childCsbData
					};
					lastAlias = splitUrl.shift();
					parentCsb = csb;
					traverseUrlRecursively(pin, childCsb, splitUrl, lastAlias, parentCsb, callback);
				}
			});
		}
	}
}

exports.traverseUrl = function (pin, url, callback) {
	exports.loadMasterCsb(pin, null, function (err, masterCsb) {
		if(err){
			callback(err);
		}else{
			var splitUrl = url.split("/");
			traverseUrlRecursively(pin, masterCsb, splitUrl, null, null, function (err, args) {
				callback(err, args);
			});
		}
	});
};

