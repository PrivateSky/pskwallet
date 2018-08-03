require("../../../../engine/core");
const crypto = $$.requireModule("pskcrypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const passReader = require("./passwordReader");
exports.defaultBackup = "http://localhost:8080";

exports.defaultPin = "12345678";

exports.paths = {
	"auxFolder"          : path.join(process.cwd(), ".privateSky"),
	"dseed"             : path.join(process.cwd(), ".privateSky", "dseed"),
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
		"data": csbData,
		"path"  : exports.getMasterPath(dseed),
		"uid"   : exports.getMasterUid(dseed)
	};
};

exports.writeCsbToFile = function (csbPath, csbData, dseed) {
	fs.writeFileSync(csbPath, crypto.encryptJson(csbData, dseed))
};

exports.enterRecord = function(pin, csb, recordType, key, fields, record, currentField, rl, callback){
	if(!rl){
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	if(currentField == fields.length){
		rl.close();
		callback(pin, csb, recordType, key, null, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
			exports.enterRecord(pin, csb, recordType, key, fields, record, currentField + 1, rl, callback);
		});
	}
};

exports.enterField = function(pin, aliasCsb, recordType, key, field, valueInserted, rl, callback){
	if(!rl){
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	rl.question("Insert " + field + ":", (answer) => {
		valueInserted = answer;
		rl.close();
		callback(pin, aliasCsb, recordType, key, field, valueInserted);
	});
};


exports.confirmOperation = function (args, prompt, callback) {
	var rl = args[args.length - 1];
	if (!rl) {
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	rl.question(prompt + "[y/n]", (answer) => {
		if (answer === "y") {
			rl.close();
			callback(...args);
		} else if (answer !== "n") {
			console.log("Invalid option");
			exports.confirmOperation(args, prompt, callback);
		}else{
			rl.close();
		}
	});

};


exports.getRecordStructure = function (recordType) {
	return JSON.parse(fs.readFileSync(path.join(exports.paths.recordStructures,"csb_record_structure_" + recordType +".json")));
};

exports.readEncryptedCsb = function (pathCsb) {
	return fs.readFileSync(pathCsb);
};

exports.readCsb = function (pathCsb, dseed) {
	if(typeof dseed === "string"){
		console.log("Avem un string");
	}
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

exports.findCsb = function (csbData, aliasCsb) {
	var csbs = csbData["records"]["Csb"];
	if(!csbs || csbs.length === 0) {
		console.log("No csbs exist");
	}else{
		while(csbs.length > 0){
			var csb = csbs.shift();
			if(csb["Title"] === aliasCsb){
				return csb;
			}else{
				var childCsb = exports.readCsb(csb["Path"], Buffer.from(csb["Dseed"], "hex"));
				if(childCsb && childCsb["records"] && childCsb["records"]["Csb"]){
					csbs = csbs.concat(childCsb["records"]["Csb"]);
				}
			}
		}
		return undefined;
	}
};

exports.getCsb = function (pin, aliasCsb) {
	var masterCsb = exports.readMasterCsb(pin);
	var csbInMaster = exports.findCsb(masterCsb.data, aliasCsb);
	if(csbInMaster){
		var encryptedCsb = exports.readEncryptedCsb(csbInMaster["Path"]);
		var dseed = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
		var csbData = crypto.decryptJson(encryptedCsb, dseed);
		return {
			"data": csbData,
			"dseed": dseed,
			"path": csbInMaster["Path"]
		};
	}
	return undefined;
};

exports.indexOfRecord = function(csbData, recordType, recordKey) {
	if(csbData && csbData["records"] && csbData["records"][recordType]){
		var recordsArray = csbData["records"][recordType];
		for(var c in recordsArray){
			if(recordsArray[c]["Title"] === recordKey){
				return c;
			}
		}
	}
	return -1;
};
exports.indexOfKey = function(arr, property, key){
	for(var i in arr){
		if(arr[i][property] === key){
			return i;
		}
	}
	return -1;
};


exports.traverseUrl = function (pin, csbData, url, lastCsb) {
	var splitUrl = url.split("/");
	var record = splitUrl[0];
	var index = exports.indexOfRecord(csbData,"Csb", record);
	if(index < 0){
		splitUrl.unshift(lastCsb);
		return splitUrl;
	}else {
		if (csbData["records"]) {
			var childCsbData = exports.readCsb(csbData["records"]["Csb"][index]["Path"], Buffer.from(csbData["records"]["Csb"][index]["Dseed"], "hex"));
			lastCsb = splitUrl.shift();
			return  exports.traverseUrl(pin, childCsbData, splitUrl.join("/"), lastCsb);
		}
	}
};

