require("../../../../engine/core");
const crypto = $$.requireModule("pskcrypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
exports.defaultBackup = "http://localhost:8080";

exports.defaultPin = "12345678";

exports.paths = {
	"auxFolder"			: path.join(process.cwd(), ".privateSky"),
	"masterCsb"			: path.join(process.cwd(), ".privateSky", "master"),
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

var enterPin = function(args, noTries, rl, callback){
	if(!rl) {
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	if(noTries == 0){
		rl.close();
	}else {
		rl.question("Insert pin:", (answer) => {
			if (checkPinIsValid(answer)) {
				if(!Array.isArray(args)){
					args = [args];
				}
				args.unshift(answer);
				rl.close();
				callback(...args);
			} else {
				console.log("Pin is invalid");
				enterPin(args, noTries-1, rl, callback);
			}
		})
	}
};

exports.requirePin = function (args, callback) {
	if(exports.masterCsbExists()){
		enterPin(args, 3, null, callback);
	}else{
		exports.createMasterCsb();
		if(!Array.isArray(args)){
			args = [args];
		}
		args.unshift(null);
		callback(...args);
	}
};
exports.enterSeed = function (callback) {
	const rl = readline.createInterface({
		input:  process.stdin,
		output: process.stdout
	});
	rl.question("Enter seed:", (answer) => {
		var seed = Buffer.from(answer, "base64");
		console.log(seed.toString());
		if(!fs.existsSync(exports.paths.auxFolder)){
			fs.mkdirSync(exports.paths.auxFolder);
			rl.close();
			callback(seed)
		}else {
			if (checkSeedIsValid(seed)) {
				rl.close();
				callback(seed);
			} else {
				throw new Error("Seed is invalid");
			}
		}
	})
}

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
	pin = pin || exports.defaultPin;
	pathMaster = pathMaster || exports.paths.masterCsb;
	fs.mkdirSync(exports.paths.auxFolder);
	var seed = crypto.generateSeed(exports.defaultBackup);
	console.log("The following string represents the seed.Please save it.");
	console.log(seed.toString("base64"));
	var dseed = crypto.deriveSeed(seed);
	crypto.saveDSeed(dseed, pin, exports.paths.dseed);
	var masterCsb = exports.defaultCSB();
	// exports.paths["masterCsb"] = path.join(exports.paths.auxFolder, exports.generateCsbId(seed, true));
	// masterCsb["backups"].push(exports.paths.masterCsb);
	fs.writeFileSync(pathMaster, crypto.encryptJson(masterCsb, dseed));

};

exports.readMasterCsb = function(pin, seed){
	pin = pin || exports.defaultPin;
	if(seed){
		var dseed = crypto.deriveSeed(seed);
	}else {
		var dseed = crypto.loadDseed(pin, exports.paths.dseed);
	}
	var encryptedCSB = fs.readFileSync(exports.paths.masterCsb);
	var csbData = crypto.decryptJson(encryptedCSB, dseed);

	return {
		"dseed"  : dseed,
		"csbData": csbData
	};
};

exports.writeCsbToFile = function (csbPath, csbData, dseed) {
	fs.writeFileSync(csbPath, crypto.encryptJson(csbData, dseed))
};

exports.enterField = function(pin, aliasCsb, recordType, fields, record, currentField, rl,  callback){
	if(!rl) {
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	if(currentField == fields.length){
		rl.close();
		callback(pin, aliasCsb, recordType, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
			exports.enterField(pin, aliasCsb, recordType, fields, record, currentField + 1, rl, callback);

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


var checkSeedIsValid = function (seed) {
	var dseed = crypto.deriveSeed(seed);
	var encryptedMaster = fs.readFileSync(exports.paths.masterCsb);
	try{
		crypto.decryptJson(encryptedMaster, dseed);
	}catch(e){
		return false;
	}
	return true;
};

