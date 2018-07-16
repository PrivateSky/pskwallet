
var crypto = require('../../../pskcrypto/cryptography');
var fs = require('fs');
var utils = require('../utils/utils');
var path = require('path');
// require("../flows/insertPin");
// require("../flows/addKey");
const readline = require("readline");
rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

enterPin = function(callback, args, noTries){
	if(noTries == 0){
		rl.close();
		return;
	}else {
		rl.question("Insert pin:", (answer) => {
			if (utils.checkPinIsValid(answer)) {
			if(!Array.isArray(args)){
				args = [args];
			}
			args.unshift(answer);
			callback(...args);
		} else {
			console.log("Pin is invalid");
			enterPin(callback, args, noTries-1)
		}
	})
	}
};
enterField = function(pin,aliasCsb, recordType, fields, record, currentField, callback){
	if(currentField == fields.length){
		rl.close();
		callback(pin, aliasCsb, recordType, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
		enterField(pin, aliasCsb, recordType, fields, record, currentField + 1, callback);

	});
	}
};

onAddCsb = function (pin, aliasCSB){
	rl.close();
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
	console.log("On add csb; seed =", seed);
	masterCSB.csbData[seed.toString('hex')] = {
		'alias': aliasCSB,
		'path' : pathCsb
	};
	fs.writeFileSync(utils.paths.masterCSB, crypto.encryptJson(masterCSB.csbData, masterCSB.dseed));
	var dseed = crypto.deriveSeed(seed);
	fs.writeFileSync(pathCsb, crypto.encryptJson(csb, dseed));
};




onSetPin = function(oldPin, newPin){
	rl.close();
	var masterCSB = utils.readMasterCsb(oldPin);
	crypto.encryptDSeed(masterCSB.dseed, newPin, utils.paths.dseed);
	fs.writeFileSync(utils.paths.masterCSB, crypto.encryptJson(masterCSB.csbData, masterCSB.dseed));
	console.log('setPin:');
};

onSetKey = function (pin, aliasCsb,recordType, record) {
	var masterCSB = utils.readMasterCsb(pin);

	for (var seed in masterCSB.csbData) {
		if (masterCSB.csbData[seed] && masterCSB.csbData[seed]['alias'] == aliasCsb) {
			var csb = fs.readFileSync(masterCSB.csbData[seed]["path"]);
			var dseed = crypto.deriveSeed(Buffer.from(seed, 'hex'));
			csb = crypto.decryptJson(csb, dseed);
			// var recordType = Object.keys(record)[0];
			if(!csb[recordType]){
				csb[recordType] = [];
			}
			if(Object.keys(record).length == 1){
				var key = Object.keys(record)[0];
				csb[recordType][key] = record[key];
			}else if(Object.keys(record).length > 1){
				csb[recordType].push(record);

			}
			fs.writeFileSync(masterCSB.csbData[seed]["path"], crypto.encryptJson(csb, dseed));
			break;
		}
	}



};

doSetPin = function (newPin) {
	enterPin(onSetPin, newPin, 3);
};

doAddCSB = function (aliasCSB) {
	enterPin(onAddCsb, aliasCSB, 3);
};

doKeySet = function (aliasCsb, recordType, keyName) {
	var recordStructure = JSON.parse(fs.readFileSync(path.join(utils.paths.recordStructures, "csb_record_structure_" + recordType +".json")));
	var fields = recordStructure["fields"];
	var field = [];
	if(keyName){
		for(var p in fields){
			if(fields[p]["fieldName"] == keyName){
				field.push(fields[p]);
				break;
			}
		}
	}else{
		field = fields;
	}
	var record = {};
	enterPin(enterField, [aliasCsb, recordType, field, record, 0, onSetKey], 3);
	// enterField(onSetKey, fields, record, 0);
};

onKeyGet = function (pin, aliasCsb, recordType, keyName) {
	rl.close();

	var masterCSB = utils.readMasterCsb(pin);
	for (var seed in masterCSB.csbData) {
		if (masterCSB.csbData[seed] && masterCSB.csbData[seed]['alias'] == aliasCsb) {
			var encryptedCsb = fs.readFileSync(masterCSB.csbData[seed]["path"]);
			var dseed = crypto.deriveSeed(Buffer.from(seed, 'hex'));
			var csb = crypto.decryptJson(encryptedCsb, dseed);
			break;
		}
	}
	var recordStructure = JSON.parse(fs.readFileSync(path.join(utils.paths.recordStructures,"csb_record_structure_" + recordType +".json")));
	var fields = recordStructure["fields"];

	var records = csb[recordType];
	if(keyName){
		for(var r in records){
			if(records[r][keyName]){
				console.log(records[r][keyName]);
			}
		}

	}else{
		console.log(csb[recordType]);
	}
};

doKeyGet = function (aliasCsb, recordType, keyName) {
	enterPin(onKeyGet, [aliasCsb, recordType, keyName]);
};


addCommand("set", "pin", doSetPin, "<newPin>"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("key", "set", doKeySet, "<csbAlias> <recordType>  <keyName>"); //seteaza o cheie intr-un csb
addCommand("key", "get", doKeyGet, "<csbAlias> <recordType> <keyName> "); //citeste o cheie intr-un csb

// doAddCSB("newCsb");
// doSetPin("123");
// doKeySet("newCsb","CreditCard");
// doKeyGet("newCsb", "CreditCard", "Title");