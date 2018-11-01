$$.loadLibrary("flows", require("../flows"));
var is = require("interact").createInteractionSpace();
const utils = require('../../utils/consoleUtils');
const path = require("path");

function readPin(noTries) {
	var self = this;
	utils.insertPassword("Insert pin:", noTries, function (err, pin) {
		if(noTries < 3 && noTries > 0){
			console.log("Invalid pin");
			console.log("Try again");
		}
		self.swarm("validatePin", pin, noTries);
	})
}

function generateErrorHandler(){
	return function(err,info, isWarning){
		if(isWarning){
			console.log("Warning", info);

		} else{

			console.log("Error", info, err);
		}
	}
}

function generateMessagePrinter(){
	return function(message){
		console.log(message);
	}
}

function doSetPin() {
	is.startSwarm("setPin", "start").on({
		enterOldPin: readPin,
		enterNewPin: function () {
			var self = this;
			utils.insertPassword("Insert new pin:", 3, function(err, newPin){
				self.swarm("actualizePin", newPin);
			});
		},

	})
}

function doCreateCsb(aliasCSB) {
	is.startSwarm("createCsb", "start", aliasCSB).on({
		readPin: function (noTries, defaultPin, isFirstCall) {
			var self = this;
			if(isFirstCall){
				self.swarm("createMasterCsb", defaultPin,);
			}else {
				utils.insertPassword("Insert pin:", noTries, function (err, pin) {
					if (noTries < 3 && noTries > 0) {
						console.log("Invalid pin");
						console.log("Try again");
					}
					self.swarm("validatePin", pin, noTries);
				})
			}
		},
		printInfo: generateMessagePrinter(),
		printSensitiveInfo: function (seed, defaultPin) {
			console.log("The following string represents the seed. Please save it.");
			console.log();
			console.log(seed.toString("base64"));
			console.log();
			console.log("The default pin is:", defaultPin);
			console.log();
		}
	});
}

function doSetKey(aliasCsb, recordType, key, field) {
	is.startSwarm("setKey", "start", aliasCsb, recordType, key, field).on({
		readPin:readPin,
		readStructure: function (pin, aliasCsb, recordType, key, field) {
			var self = this;
			utils.getRecordStructure(recordType, function (err, recordStructure) {
				if(err){
					throw err;``
				}
				var fields = recordStructure["fields"];
				self.swarm("checkInputValidity", pin, aliasCsb, recordType, key, field, fields);
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	});
}

function doResetPin(){
	is.startSwarm("resetPin", "start").on({
		readSeed:function(){
			var self = this;
			utils.insertPassword("Enter seed: ", 3, function (err, seed) {
				self.swarm("checkSeedValidity", seed);
			});
		},
		readPin: function () {
			var self = this;
			utils.insertPassword("Enter a new pin: ", 3, function (err, pin) {
				self.swarm("updateData", pin);
			});
		},
		printInfo: generateMessagePrinter()
	})
}
doGetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.start("flows.getKey").start(aliasCsb, recordType, key, field);
};

doSaveBackup = function (url) {
	is.startSwarm("saveBackup", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	});
};


function doRestore(alias) {
	is.startSwarm("restore", "start", alias).on({
		readSeed: function () {
			var self = this;
			utils.insertPassword("Enter seed:", 3, function (err, seed) {
				if (err) {
					throw err;
				}
				self.swarm("checkMasterExists", Buffer.from(seed, "base64"));
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler
	});
}

function doSetUrl(url) {
	is.startSwarm("setUrl", "start", url).on({
		readPin: readPin,
		handleError: generateErrorHandler(),
		confirmOverwrite: function (csb, recordType, key, field, fields, getRecord) {
			var self = this;

			function generateConfirmationCb(){
				return function (err, record) {
					if(err){
						$$.errorHandler.throwError(err);
					}else{
						self.swarm("addRecord", record, csb, recordType, key, field);
					}
				}
			}
			if(field){
				console.log("You are about to overwrite the following field:");
			}else{
				console.log("You are about to overwrite the following record:");
			}
			console.log(getRecord(csb, recordType, key, field));
			utils.confirmOperation("Do you want to continue?", null, function(err, rl){
				if(field){
					utils.enterField(field, rl, generateConfirmationCb());
				}else{
					utils.enterRecord(fields, 0, null, rl, generateConfirmationCb());
				}

			});
		},
		enterRecord: function (csb, recordType, key, field, fields) {
			var self = this;
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				if(err){
					throw err;
				}
				self.swarm("addRecord", record, csb, recordType, key, field);
			});
		},
		printInfo: generateMessagePrinter()
	});
}

function doGetUrl(url) {
	is.startSwarm("getUrl", "start", url, function(err, result){
		console.log(result);
	}).on({
		readPin: readPin,
		handleError:generateErrorHandler(),
		printRecord: function (record) {
			console.log(record);
			this.swarm("checkoutResult", record);
		}
	});
}

function doAddFile(csbUrl, filePath) {
	is.startSwarm("addFile", "start", csbUrl, filePath).on({
		readPin: readPin,
		confirmOverwriteFile: function (filePath, csb, alias, indexAdiacent) {
			var self = this;
			console.log("A file with the name", path.basename(filePath), "already exists in the current csb");
			var prompt = "Do you want to overwrite it ?";
			utils.confirmOperation(prompt, null, function (err, rl) {
				if(err){
					throw err;
				}
				self.swarm("saveChildInCsb", filePath, csb, alias, indexAdiacent);
			});
		},
		onComplete: function (filePath, aliasCsb) {
			console.log(filePath, "was added in", aliasCsb);
		},
		handleError: generateErrorHandler()
	});
}

doAddFolder = function(csbUrl, folderPath){
	$$.flow.start("flows.addFile").start(csbUrl, folderPath);
};

function doExtract(url){
	is.startSwarm("extract", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError:generateErrorHandler()
	});
}

doListCsbs = function (aliasCsb) {
	$$.flow.start("flows.listCsbs").start(aliasCsb);
};

doPrintCsb = function (aliasCsb) {
	$$.flow.start("flows.printCsb").start(aliasCsb);
};

doCopy = function (sourceUrl, destUrl) {
	is.startSwarm("copy", "start", sourceUrl, destUrl).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
};

doDelete = function (url) {
	is.startSwarm("delete", "start", url).on({
		readPin: readPin,
		confirmDeletion: function (recordType) {
			var self = this;
			console.log("You are about to delete all records of type", recordType);
			var prompt = "Do you want to proceed?";
			utils.confirmOperation(prompt, null, function (err) {
				if(err){
					throw err;
				}
				self.swarm("deleteMultipleRecords");
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
};

doMoveUrl = function (sourceUrl, destUrl) {
	$$.flow.start("flows.moveUrl").start(sourceUrl, destUrl);
};


addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doCreateCsb, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("print", "csb", doPrintCsb, "<aliasCsb>\t\t\t\t |print the CSB having the alias <aliasCsb>");
addCommand("set", "key", doSetKey, "<aliasCsb> <recordType> <key> <field>   |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<aliasCsb> <recordType> <key> <field>   |get the key " ); //citeste o cheie intr-un csb
addCommand("save", "backup", doSaveBackup,"<url>\t\t\t\t |save all csbs at address <url>");
addCommand("restore", null, doRestore, "<alias>\t\t\t\t |restore the csb  or archive having the name <alias> from one of the addresses stored\n\t\t\t\t\t\t\t  in backup\n");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("set", "url", doSetUrl, "<url> \t\t\t\t\t |set/update the record/field pointed by the provided <url>");
addCommand("get", "url", doGetUrl, "<url> \t\t\t\t\t |print the record/field indicated by te provided <url>");
addCommand("add", "file", doAddFile, "<csbUrl> <filePath> \t\t\t |add a file to the csb pointed by <csbUrl>");
addCommand("add", "folder", doAddFile, "<csbUrl> <folderPath> \t\t |add a folder to the csb pointed by <csbUrl>");
addCommand("extract", null, doExtract, "<csbUrl> <alias> \t\t\t |decrypt file/folder/csb having the alias <alias>, contained\n\t\t\t\t\t\t\t   by the csb pointed to by <csbUrl>\n");
addCommand("list", "csbs", doListCsbs, "<aliasCsb> \t\t\t\t |show all child csbs in the csb <aliasCsb>; if <aliasCsb> \n\t\t\t\t\t\t\t  is not provided, the command will print all the csbs \n\t\t\t\t\t\t\t  in the current folder\n");
addCommand("copy", null, doCopy, "<srcUrl> <destUrl> \t |copy the csb <srcAlias> to <destAlias>");
addCommand("delete", null, doDelete, "<url>");
addCommand("move", "url", doMoveUrl, "<srcUrl> <destUrl>");
