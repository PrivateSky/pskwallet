var crypto = require('../../../pskcrypto/cryptography');
var fs = require('fs');
var utils = require('../utils/utils');
var path = require('path');

doSetPin = function(newPin, oldPin){
	var masterCSB = utils.readMasterCsb(oldPin);
	crypto.encryptDSeed(masterCSB.dseed, newPin, utils.paths.dseed);
	fs.writeFileSync(utils.paths.masterCSB, crypto.encryptJson(masterCSB.csbData, masterCSB.dseed));
	console.log('setPin:');
};

doAddCSB = function (pin, aliasCSB) {
	utils.ensureMasterCSBExists();
	var csb       = utils.defaultCSB();
	var seed      = crypto.generateSeed();
	var masterCSB = utils.readMasterCsb(pin);
	for (var s in masterCSB.csbData) {
		if (masterCSB.csbData[s] && masterCSB.csbData[s]['alias'] == aliasCSB) {
			throw new Error('A csb with the provided alias already exists');
		}
	}
	var pathCsb = utils.generateCsbId(seed);
	masterCSB.csbData[seed] = {
		'alias': aliasCSB,
		'path' : pathCsb
	};
	fs.writeFileSync(utils.paths.masterCSB, crypto.encryptJson(masterCSB.csbData, masterCSB.dseed));
	var dseed = crypto.deriveSeed(seed);
	fs.writeFileSync(pathCsb, crypto.encryptJson(csb, dseed));
};

exports.doKeySet = function (pin, aliasCSB, keyName, value) {

};

// addCommand("set", "pin", doSetPin); //seteaza la csb-ul master
// addCommand("create", "csb", doAddCSB, "<pin> <csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
// addCommand("key", "set", doSetKey); //seteaza o cheie intr-un csb
// addCommand("key", "get", doGetKey); //seteaza o cheie intr-un csb

// function dummy(){
//     console.log("Executing dummy command ", arguments);
// }


addCommand("set", "pin", doSetPin, "<newPin> <oldPin>"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<pin> <csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
// addCommand("key", "set", dummy, "<pin> <csbAlias> <keyName> <value>"); //seteaza o cheie intr-un csb
// addCommand("key", "get", dummy, "<pin> <csbAlias> <keyName> "); //citeste o cheie intr-un csb

