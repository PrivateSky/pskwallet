var crypto = require('../../../pskcrypto/cryptography');
var fs = require('fs');
var path = require('path');

exports.paths = {
	'auxFolder':'./.privateSky/',
	'masterCSB':'./.privateSky/master.csb',
	'masterDseed':'./.privateSky/master.dseed'
};
exports.extensions = {
	'csb':'.csb',
	'dseed': '.dseed'
};


exports.defaultCSB = function() {
	var csb = {
		'version': 1,
		'protocolVersion': 1
	};

	return csb;
};

exports.ensureMasterCSBExists = function(pin) {
	if (!fs.existsSync(exports.paths.auxFolder)) {
		fs.mkdirSync(exports.paths.auxFolder);
	}
	exports.ensureDseedExists(pin, 'master');
	// var pathMasterCsb = exports.paths.auxFolder + exports.generateCsbId(pin, 'master');
	var pathMasterCsb = path.join(exports.paths.auxFolder, 'master' + exports.extensions.csb);
	if (!fs.existsSync(pathMasterCsb)) {
		var masterCSB = {};
		exports.writeCSB(pin, 'master', masterCSB);
	}


};

exports.ensureDseedExists = function(pin, aliasCSB){
	var dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	if(!fs.existsSync(dseedPath)){
		crypto.saveDerivedSeed(crypto.generateSeed(), pin, null, dseedPath);
	}
};

exports.readCSB = function(pin, aliasCSB){
	var pathCSB = "./";
	if(aliasCSB == 'master') {
		pathCSB = exports.paths.auxFolder;
	}
	// pathCSB += exports.generateCsbId(pin, aliasCSB);
	pathCSB = path.join(pathCSB, aliasCSB + exports.extensions.csb);
	var dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	var encryptedCSB = fs.readFileSync(pathCSB);

	return crypto.decryptJson(encryptedCSB, pin, dseedPath);
};

exports.writeCSB = function(pin, aliasCSB, csb){
	var pathCSB = "./";
	if(aliasCSB == 'master') {
		pathCSB = exports.paths.auxFolder;
	}
	var dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	// pathCSB += exports.generateCsbId(pin, aliasCSB);
	pathCSB = path.join(pathCSB, aliasCSB + exports.extensions.csb);
	fs.writeFileSync(pathCSB, crypto.encryptJson(csb, pin, dseedPath));
};

exports.generateCsbId = function (pin, aliasCSB) {
	var pathCSB = "./";
	if(aliasCSB == 'master'){
		pathCSB = exports.paths.auxFolder;
	}
	pathCSB = path.resolve(pathCSB);
	var dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	var dseed = crypto.decryptDseed(pin, dseedPath);
	var csbId = Buffer.concat([Buffer.from(pathCSB), dseed]);
	return crypto.hashBlob(csbId);
};

