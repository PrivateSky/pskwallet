var crypto = require('../../../pskcrypto/cryptography');
var fs = require('fs');
var utils = require('../utils/utils');
var path = require('path');



exports.doSetPin = function(oldPin, newPin){

	var encryptedMaster = fs.readFileSync(utils.paths.masterCSB);
	var masterCSB = utils.readCSB(oldPin, 'master');
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


// addCommand("set", "pin", doSetPin); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<pin> <csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
// addCommand("key", "set", doSetKey); //seteaza o cheie intr-un csb
// addCommand("key", "get", doGetKey); //seteaza o cheie intr-un csb

// function dummy(){
//     console.log("Executing dummy command ", arguments);
// }


// addCommand("set", "pin", dummy, "<newPin> <oldPin>"); //seteaza la csb-ul master
// addCommand("create", "csb", dummy, "<csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
// addCommand("key", "set", dummy, "<keyName> <value>"); //seteaza o cheie intr-un csb
// addCommand("key", "get", dummy, "<keyName> "); //citeste o cheie intr-un csb

