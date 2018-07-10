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
		'id': '',
		'version': 1,
		'protocolVersion': 1
	};
	csb['id'] = exports.generateID();

	return csb;
};

exports.ensureMasterCSBExists = function(pin) {
	if (!fs.existsSync(exports.paths.auxFolder)) {
		fs.mkdirSync(exports.paths.auxFolder);
	}
	if (!fs.existsSync(exports.paths.masterCSB)) {
		var masterCSB = {};
		exports.ensureDseedExists(pin, 'master');
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
	var pathCSB = '';
	var dseedPath ='';
	if(aliasCSB == 'master'){
		pathCSB = exports.paths.masterCSB;
		dseedPath = exports.paths.masterDseed;
	}else{
		pathCSB = aliasCSB + exports.extensions.csb;
		dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	}
	var encryptedCSB = fs.readFileSync(pathCSB);

	return crypto.decryptJson(encryptedCSB, pin, dseedPath);
};

exports.writeCSB = function(pin, aliasCSB, csb){
	var pathCSB = '';
	var dseedPath ='';
	if(aliasCSB == 'master'){
		pathCSB = exports.paths.masterCSB;
		dseedPath = exports.paths.masterDseed;
	}else{
		pathCSB = aliasCSB + exports.extensions.csb;
		dseedPath = path.join(exports.paths.auxFolder, aliasCSB + exports.extensions.dseed);
	}
	fs.writeFileSync(pathCSB, crypto.encryptJson(csb, pin, dseedPath));
};

exports.generateID = function (){
	return Math.random().toString(36).substring(2, 20)
};


