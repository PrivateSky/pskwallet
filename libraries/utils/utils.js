require("../../../../engine/core");
$$.requireModule("callflow");
const crypto = require("../../../pskcrypto/cryptography");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

exports.checkPinIsValid = function (pin) {
	exports.ensureMasterCsbExists(pin);
	try {
		exports.readMasterCsb(pin);
	}catch(e){
		console.log(e.message);
		return false;
	}
	return true;
};

var defaultPin = "12345678";

exports.paths = {
	"auxFolder"			: path.join(process.cwd(), ".privateSky/"),
	"masterCsb"			: path.join(process.cwd(), ".privateSky/master"),
	"dseed"				: path.join(process.cwd(), ".privateSky/dseed"),
	"recordStructures"  : path.join(__dirname, "../utils/recordStructures")

};

function encode(buffer) {
	return buffer.toString('base64')
		.replace(/\+/g, '')
		.replace(/\//g, '')
		.replace(/=+$/, '');
}

exports.defaultCSB = function() {
	return {
		"version": 1,
		"protocolVersion": 1,
		"backups": [
			"www.privatesky.com",
			"www.dropbox.com",
			"www.drive.google.com"
		]
	};


};



exports.ensureMasterCsbExists = function(pin) {
	pin = pin || defaultPin;
	if (!fs.existsSync(exports.paths.auxFolder)) {
		fs.mkdirSync(exports.paths.auxFolder);
	}
	if(!fs.existsSync(exports.paths.dseed)){
		var seed = crypto.generateSeed();
		var dseed = crypto.deriveSeed(seed);
		crypto.encryptDSeed(dseed, pin, exports.paths.dseed);
		var masterCsb = exports.defaultCSB();
		masterCsb["backups"].push(exports.paths.masterCsb);
		fs.writeFileSync(exports.paths.masterCsb, crypto.encryptJson(masterCsb, dseed));
	}
};

exports.readMasterCsb = function(pin){
	pin = pin || defaultPin;
	var dseed = crypto.decryptDseed(pin, exports.paths.dseed);
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

exports.generateCsbId = function (seed, isMaster) {
	var parentFolderPath = __filename;
	if(isMaster){
		parentFolderPath = exports.paths.auxFolder;
	}
	parentFolderPath = path.resolve(parentFolderPath);
	var dseed 	  = crypto.deriveSeed(seed);
	var csbId     = Buffer.concat([Buffer.from(parentFolderPath), dseed]);
	var digest    = crypto.pskHash(csbId);
	return encode(digest);
};

function inputErrorHandler(err, readline, callback ) {
	readline.close();
	callback(err);
}

exports.enterPin = function(args, noTries, callback){
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if(noTries == 0){
		rl.close();
		// callback(err);

	}else {
		rl.question("Insert pin:", (answer) => {
			if (exports.checkPinIsValid(answer)) {
				if(!Array.isArray(args)){
					args = [args];
				}
				args.unshift(answer);
				callback(...args);
			} else {
				console.log("Pin is invalid");
				exports.enterPin(args, noTries-1, callback)
			}
		})
	}
};

exports.enterField = function(pin, aliasCsb, recordType, fields, record, currentField, callback){
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if(currentField == fields.length){
		rl.close();
		callback(pin, aliasCsb, recordType, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			if(field["fieldName"] == "Title"){
				callback(pin, aliasCsb, recordType, record);
			}
			record[field["fieldName"]] = answer;

			exports.enterField(pin, aliasCsb, recordType, fields, record, currentField + 1, callback);

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

exports.readCsb = function (pathCsb) {
		return fs.readFileSync(pathCsb);
};
