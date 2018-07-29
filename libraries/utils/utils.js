require("../../../../engine/core");
const crypto = $$.requireModule("pskcrypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const passReader = require("./passwordReader");
exports.defaultBackup = "http://localhost:8080";

exports.defaultPin = "12345678";

exports.paths = {
	"auxFolder"			: path.join(process.cwd(), ".privateSky"),
	"dseed"				: path.join(process.cwd(), ".privateSky", "dseed"),
	"recordStructures"  : path.join(__dirname, path.normalize("../utils/recordStructures"))
};

var checkPinIsValid = function (pin) {
	try {
		exports.readMasterCsb(pin);
	}catch(e){
		return false;
	}
	return true;
};

var checkSeedIsValid = function (seed) {
	var dseed = crypto.deriveSeed(seed);
	var encryptedMaster = fs.readFileSync(exports.getMasterPath(dseed));
	try{
		crypto.decryptJson(encryptedMaster, dseed);
	}catch(e){
		return false;
	}
	return true;
};

var enterPin = function(args, prompt, noTries, callback){
	if(!prompt){
		prompt = "Insert pin:";
	}
	if(noTries == 0){
		console.log("You have inserted an invalid pin 3 times");
		console.log("Preparing to exit");
	}else {
		passReader.getPassword(prompt, function (err, pin) {
			if(err) {
				console.log("Pin is invalid");
				console.log("Try again");
				enterPin(args, prompt, noTries-1, callback);
			}else{
				if (checkPinIsValid(pin)) {
					if(!Array.isArray(args)){
						args = [args];
					}
					args.unshift(pin);
					callback(...args);
				} else {
					console.log("Pin is invalid");
					console.log("Try again");
					enterPin(args, prompt, noTries-1, callback);
				}
			}
		});
	}
};

exports.requirePin = function (args, prompt, callback) {
	if(exports.masterCsbExists()){
		enterPin(args, prompt, 3, callback);
	}else{
		exports.createMasterCsb();
		if(!Array.isArray(args)){
			args = [args];
		}
		args.unshift(null);
		callback(...args);
	}
};
exports.enterSeed = function (args, callback) {
	passReader.getPassword("Enter seed:", function (err, answer) {
		if(!err) {
			if(!Array.isArray(args)){
				args = [args];
			}
			var seed = Buffer.from(answer, "base64");
			if (!fs.existsSync(exports.paths.auxFolder)) {
				fs.mkdirSync(exports.paths.auxFolder);
				args.unshift(seed);
				callback(...args);
			} else {
				if (checkSeedIsValid(seed)) {
					args.unshift(seed);
					callback(...args);
				} else {
					console.log("Seed is invalid. Goodbye!");
					process.exit();
				}
			}
		}
	});
};

exports.defaultCSB = function() {
	return {
		"version": 1,
		"protocolVersion": 1,
		"backups": []
	};
};

exports.masterCsbExists = function () {
	if(fs.existsSync(exports.paths.dseed)){
		return true;
	}else{
		return false;
	}
};

exports.createMasterCsb = function(pin, pathMaster) {
	console.log("Creating master csb");
	pin = pin || exports.defaultPin;
	fs.mkdirSync(exports.paths.auxFolder);
	var seed = crypto.generateSeed(exports.defaultBackup);
	console.log("The following string represents the seed.Please save it.");
	console.log(seed.toString("base64"));
	var dseed = crypto.deriveSeed(seed);
	pathMaster = pathMaster || exports.getMasterPath(dseed);
	console.log("masterPath", pathMaster);
	crypto.saveDSeed(dseed, pin, exports.paths.dseed);
	var masterCsb = exports.defaultCSB();
	// exports.paths["masterCsb"] = path.join(exports.paths.auxFolder, exports.generateCsbId(seed, true));
	// masterCsb["backups"].push(exports.paths.masterCsb);
	fs.writeFileSync(pathMaster, crypto.encryptJson(masterCsb, dseed));
	console.log("Master csb has been created");

};

exports.readMasterCsb = function(pin, seed){
	pin = pin || exports.defaultPin;
	if(seed){
		var dseed = crypto.deriveSeed(seed);
	}else {
		var dseed = crypto.loadDseed(pin, exports.paths.dseed);
	}
	var encryptedCSB = fs.readFileSync(exports.getMasterPath(dseed));
	var csbData = crypto.decryptJson(encryptedCSB, dseed);

	return {
		"dseed"  : dseed,
		"csbData": csbData,
		"path"	 : exports.getMasterPath(dseed),
		"uid"	 : exports.getMasterUid(dseed)
	};
};

exports.writeCsbToFile = function (csbPath, csbData, dseed) {
	fs.writeFileSync(csbPath, crypto.encryptJson(csbData, dseed))
};

exports.enterField = function(pin, aliasCsb, recordType,key, fields, record, currentField, callback){
	if(currentField == fields.length){
		callback(pin, aliasCsb, recordType, key, record);
	}else {
		var field = fields[currentField];
		passReader.getPassword("Insert " + field["fieldName"] + ":", (err, answer) => {
			if(err){
				console.log("An invalid character was introduced", "Abandoning operation");
			}else {
				record[field["fieldName"]] = answer;
				exports.enterField(pin, aliasCsb, recordType, key, fields, record, currentField + 1,callback);
			}
		});
	}
};

exports.getRecordStructure = function (recordType) {
	return JSON.parse(fs.readFileSync(path.join(exports.paths.recordStructures,"csb_record_structure_" + recordType +".json")));
};

exports.checkAliasExists = function (masterCsb, aliasCsb) {
	var recordsInMaster = masterCsb.csbData["records"];
	if(recordsInMaster && recordsInMaster["Csb"]){
		for(var c in recordsInMaster["Csb"]) {
			if (recordsInMaster["Csb"][c]["Alias"] == aliasCsb) {
				return true;
			}
		}
	}
	return false;
};

exports.readEncryptedCsb = function (pathCsb) {
		return fs.readFileSync(pathCsb);
};

exports.readCsb = function (pathCsb, dseed) {
	if(fs.existsSync(pathCsb)) {
		var encryptedCsb = exports.readEncryptedCsb(pathCsb);
		return crypto.decryptJson(encryptedCsb, dseed);
	}else{
		return;
	}

};

exports.getMasterPath = function(dseed){
	return path.join(exports.paths.auxFolder, crypto.generateSafeUid(dseed, exports.paths.auxFolder));
};

exports.getMasterUid = function (dseed){
	return crypto.generateSafeUid(dseed, exports.paths.auxFolder)
};

exports.getCsb = function (csbData, aliasCsb) {
	var csbs = csbData["records"]["Csb"];
	if(!csbs || csbs.length == 0) {
		console.log("No csbs exist");
	}else{
		while(csbs.length > 0){
			var csb = csbs.shift();
			if(csb["Alias"] == aliasCsb){
				return csb;
			}else{
				var childCsb = exports.readCsb(csb["Path"], Buffer.from(csb["Dseed"], "hex"));
				if(childCsb && childCsb["records"] && childCsb["records"]["Csb"]){
					csbs = csbs.concat(childCsb["records"]["Csb"]);
				}
			}
		}
		console.log("No csb with the provided alias exists");
	}
};