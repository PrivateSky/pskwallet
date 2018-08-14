require("../../../../engine/core");
const crypto = $$.requireModule("pskcrypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const passReader = require("./passwordReader");
exports.defaultBackup = "http://localhost:8080";

exports.defaultPin = "12345678";

exports.Paths = {
	"auxFolder"          : path.join(process.cwd(), ".privateSky"),
	"Dseed"             : path.join(process.cwd(), ".privateSky", "Dseed"),
	"Adiacent"          : path.join(process.cwd(), "Adiacent"),
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

var enterPin = function(prompt, noTries, callback){
	prompt = prompt || "Insert pin:";
	if(noTries == 0){
		console.log("You have inserted an invalid pin 3 times");
		console.log("Preparing to exit");
	}else {
		passReader.getPassword(prompt, function (err, pin) {
			if(err) {
				console.log("Pin is invalid");
				console.log("Try again");
				enterPin(prompt, noTries-1, callback);
			}else{
				if (checkPinIsValid(pin)) {
					callback(null, pin);
				} else {
					console.log("Pin is invalid");
					console.log("Try again");
					enterPin(prompt, noTries-1, callback);
				}
			}
		});
	}
};

exports.requirePin = function (prompt, callback) {
	if(exports.masterCsbExists()){
		enterPin(prompt, 3, callback);
	}else{
		exports.createMasterCsb();
		callback();
	}
};
exports.enterSeed = function (callback) {
	passReader.getPassword("Enter seed:", function (err, answer) {
		if(!err) {
			var seed = Buffer.from(answer, "base64");
			if (!fs.existsSync(exports.Paths.auxFolder)) {
				fs.mkdirSync(exports.Paths.auxFolder);
				callback(null, seed);
			} else {
				if (checkSeedIsValid(seed)) {
					callback(null, seed);
				} else {
					callback(new Error("Invalid seed"), null);
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
	if(fs.existsSync(exports.Paths.Dseed)){
		return true;
	}else{
		return false;
	}
};

exports.createMasterCsb = function(pin, pathMaster) {
	console.log("Creating master csb");
	pin = pin || exports.defaultPin;
	fs.mkdirSync(exports.Paths.auxFolder);
	var seed = crypto.generateSeed(exports.defaultBackup);
	console.log("The following string represents the seed.Please save it.");
	console.log();
	console.log(seed.toString("base64"));
	console.log();
	console.log("The default pin is:", exports.defaultPin);
	console.log();
	var dseed = crypto.deriveSeed(seed);
	pathMaster = pathMaster || exports.getMasterPath(dseed);
	crypto.saveDSeed(dseed, pin, exports.Paths.Dseed);
	var masterCsb = exports.defaultCSB();
	// exports.Paths["masterCsb"] = path.join(exports.Paths.auxFolder, exports.generateCsbId(seed, true));
	// masterCsb["backups"].push(exports.Paths.masterCsb);
	fs.writeFileSync(pathMaster, crypto.encryptJson(masterCsb, dseed));
	console.log("Master csb has been created");

};

exports.readMasterCsb = function(pin, seed){
	pin = pin || exports.defaultPin;
	if(seed){
		var dseed = crypto.deriveSeed(seed);
	}else {
		var dseed = crypto.loadDseed(pin, exports.Paths.Dseed);
	}
	var encryptedCSB = fs.readFileSync(exports.getMasterPath(dseed));
	var csbData = crypto.decryptJson(encryptedCSB, dseed);

	return {
		"Dseed"  : dseed,
		"Data": csbData,
		"Path"  : exports.getMasterPath(dseed),
		"Uid"   : exports.getMasterUid(dseed)
	};
};

exports.writeCsbToFile = function (csbPath, csbData, dseed) {
	fs.writeFileSync(csbPath, crypto.encryptJson(csbData, dseed))
};

exports.enterRecord = function(fields, currentField, record, rl, callback){
	record = record || {};
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	if(currentField == fields.length){
		rl.close();
		callback(null, record);
	}else {
		var field = fields[currentField];
		rl.question("Insert " + field["fieldName"] + ":", (answer) => {
			record[field["fieldName"]] = answer;
			exports.enterRecord(fields, currentField + 1, record, rl, callback);
		});
	}
};

exports.enterField = function(field, rl, callback){
	 rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question("Insert " + field + ":", (answer) => {
		rl.close();
		callback(null, answer);
	});
};


exports.confirmOperation = function (prompt, rl, callback) {
	rl = rl || readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	prompt = prompt || "Do you want to continue?";
	rl.question(prompt + "[y/n]", (answer) => {
		if (answer === "y") {
			rl.close();
			callback(null, rl);
		} else if (answer !== "n") {
			console.log("Invalid option");
			exports.confirmOperation(prompt, rl, callback);
		}else{
			rl.close();
		}
	});

};


exports.getRecordStructure = function (recordType) {
	return JSON.parse(fs.readFileSync(path.join(exports.Paths.recordStructures,"csb_record_structure_" + recordType +".json")));
};

exports.readEncryptedCsb = function (pathCsb) {
	return fs.readFileSync(pathCsb);
};

exports.readCsb = function (pathCsb, dseed) {
	if(fs.existsSync(pathCsb)) {
		var encryptedCsb = exports.readEncryptedCsb(pathCsb);
		return crypto.decryptJson(encryptedCsb, dseed);
	}else{
		return;
	}
};

exports.getMasterPath = function(dseed){
	return path.join(exports.Paths.auxFolder, crypto.generateSafeUid(dseed, exports.Paths.auxFolder));
};

exports.getMasterUid = function (dseed){
	return crypto.generateSafeUid(dseed, exports.Paths.auxFolder)
};

exports.findCsb = function (csbData, aliasCsb) {
	if(!csbData || !csbData["records"] || !csbData["records"]["Csb"] || csbData["records"]["Csb"].length === 0){
		return undefined;
	}
	var csbs = csbData["records"]["Csb"];
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

};

exports.getCsb = function (pin, aliasCsb) {
	var masterCsb = exports.readMasterCsb(pin);
	if(!masterCsb.Data || !masterCsb.Data["records"]){
		return undefined;
	}
	var csbInMaster = exports.findCsb(masterCsb.Data, aliasCsb);
	if(csbInMaster){
		var encryptedCsb = exports.readEncryptedCsb(csbInMaster["Path"]);
		var dseed = crypto.deriveSeed(Buffer.from(csbInMaster["Seed"], 'hex'));
		var csbData = crypto.decryptJson(encryptedCsb, dseed);
		return {
			"Data": csbData,
			"Dseed": dseed,
			"Path": csbInMaster["Path"]
		};
	}
	return undefined;
};

exports.deleteCsb = function (csb) {
	console.log("Deleting csb", csb.Path);
	if(fs.existsSync(csb.Path)){
		fs.unlinkSync(csb.Path)
	}
};

exports.deleteMasterCsb = function (masterCsb) {
	console.log("Deleting master");
	fs.unlinkSync(masterCsb.Path);
	console.log("Deleting dseed");
	fs.unlinkSync(exports.Paths.Dseed);
	console.log("Deleting .privateSky folder");
	fs.rmdirSync(exports.Paths.auxFolder);
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


exports.traverseUrl = function (pin, csbData, url, lastCsb, parentCsbData ) {
	var splitUrl = url.split("/");
	var record = splitUrl[0];
	var index = exports.indexOfRecord(csbData,"Csb", record);
	if(index < 0){
		splitUrl.unshift(lastCsb);
		splitUrl.unshift(parentCsbData);
		return splitUrl;
	}else {
		if (csbData["records"]) {
			var childCsbData = exports.readCsb(csbData["records"]["Csb"][index]["Path"], Buffer.from(csbData["records"]["Csb"][index]["Dseed"], "hex"));
			lastCsb = splitUrl.shift();
			parentCsbData = csbData;
			return  exports.traverseUrl(pin, childCsbData, splitUrl.join("/"), lastCsb, parentCsbData);
		}
	}
};