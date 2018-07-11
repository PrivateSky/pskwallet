var crypto = require('../../../pskcrypto/cryptography');
var fs = require('fs');
var utils = require('../utils/utils');
var path = require('path');


function setPinRecursive(newPin, oldPin, aliasCsb) {
	var csb = utils.readCSB(oldPin, aliasCsb);
	if(!csb['csb']){
		var dseedPath = path.join(utils.paths.auxFolder, aliasCsb + utils.extensions.dseed);
		crypto.setPin(oldPin, newPin, dseedPath);
		utils.writeCSB(newPin, aliasCsb, csb);
	}else{
		var childCSBs = csb['csb'];
		for(var seed in childCSBs){
			setPinRecursive(newPin, oldPin, childCSBs[seed]);
		}
	}
}

doSetPin = function(newPin, oldPin){
	var masterCSB = utils.readCSB(oldPin, 'master');
	for(var s in masterCSB){
		setPinRecursive(newPin, oldPin, masterCSB[s]);
	}
	crypto.setPin(oldPin, newPin, utils.paths.masterDseed);
	utils.writeCSB(newPin, 'master', masterCSB);
	console.log('setPin:');
};

doAddCSB = function (pin, aliasCSB) {
	utils.ensureMasterCSBExists(pin);
	var csb = utils.defaultCSB();
	var seed = crypto.generateSeed();
	var masterCSB = utils.readCSB(pin, 'master');
	for(var s in masterCSB){
		if(masterCSB[s] == aliasCSB){
			throw new Error('A csb with the provided alias already exists');
		}
	}
	masterCSB[seed] = aliasCSB;
	utils.writeCSB(pin, 'master', masterCSB);
	utils.ensureDseedExists(pin, aliasCSB);
	utils.writeCSB(pin, aliasCSB, csb);
};

exports.doKeySet = function (pin, aliasCSB, keyName, value) {
	var parentCsb = utils.readCSB(pin, aliasCSB);
	if(keyName == 'csb'){
		var seed = crypto.generateSeed();
		for(var s in parentCsb){
			if(parentCsb[s] == keyName){
				throw new Error('A csb with the provided alias already exists');
			}
		}
		var aliasChildCsb = Object.keys(value)[0];
		utils.ensureDseedExists(pin, aliasChildCsb);
		utils.writeCSB(pin, aliasChildCsb, value[aliasChildCsb]);
		parentCsb[seed] = aliasChildCsb;

	}else{
		parentCsb[keyName] = value;
	}
	utils.writeCSB(pin, aliasCSB, parentCsb);

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

