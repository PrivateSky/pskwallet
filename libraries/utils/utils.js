require("../../../../engine/core");
$$.requireModule("callflow");
const crypto = require("../../../pskcrypto/cryptography");
const fs = require("fs");
const path = require("path");

exports.checkPinIsValid = function (pin) {
	exports.ensureMasterCSBExists(pin);
	try {
		exports.readMasterCsb(pin);
	}catch(e){
		// console.log(e.message);
		return false;
	}
	return true;
};

var defaultPin = "12345678";

exports.paths = {
	"auxFolder": "./.privateSky/",
	"masterCSB": "./.privateSky/master",
	"dseed": "./.privateSky/dseed",
	"recordStructures": path.resolve("../libraries/utils/recordStructures")

};

function encode(buffer) {
	return buffer.toString('base64')
		.replace(/\+/g, '')
		.replace(/\//g, '')
		.replace(/=+$/, '');
}

exports.defaultCSB = function() {
	var csb = {
		'version': 1,
		'protocolVersion': 1
	};

	return csb;
};



exports.ensureMasterCSBExists = function(pin) {
	pin = pin || defaultPin;
	if (!fs.existsSync(exports.paths.auxFolder)) {
		fs.mkdirSync(exports.paths.auxFolder);
	}
	if(!fs.existsSync(exports.paths.dseed)){
		var seed = crypto.generateSeed();
		var dseed = crypto.deriveSeed(seed);
		crypto.encryptDSeed(dseed, pin, exports.paths.dseed);
		var masterCsb = {};
		fs.writeFileSync(exports.paths.masterCSB, crypto.encryptJson(masterCsb, dseed));
	}
};

exports.readMasterCsb = function(pin){
	pin = pin || defaultPin;
	var dseed = crypto.decryptDseed(pin, exports.paths.dseed);
	var encryptedCSB = fs.readFileSync(exports.paths.masterCSB);
	var csbData = crypto.decryptJson(encryptedCSB, dseed);

	return {
		'dseed'  : dseed,
		'csbData': csbData
	};
};

exports.generateCsbId = function (seed, isMaster) {
	var parentFolderPath = './';
	if(isMaster){
		parentFolderPath = exports.paths.auxFolder;
	}
	parentFolderPath = path.resolve(parentFolderPath);
	var dseed 	  = crypto.deriveSeed(seed);
	var csbId     = Buffer.concat([Buffer.from(parentFolderPath), dseed]);
	var digest    = crypto.hashBlob(csbId);
	return encode(digest);
};
