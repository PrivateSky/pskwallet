$$.loadLibrary("flows", require("../flows"));
var is = require("interact").createInteractionSpace();
const utils = require('../utils/utils');
const getPassword = require("../utils/getPassword").readPassword;
const path = require("path");
function doSetPin() {
	is.startSwarm("setPin", "start").on({
		enterOldPin: function (noTries) {
			var self = this;
			utils.insertPassword("Enter old pin:", noTries, function (err, oldPin) {
				self.swarm("validatePin", oldPin, noTries);
				});
		},
		enterNewPin: function () {
			var self = this;
			utils.insertPassword("Insert new pin:",3 , function(err, newPin){
				self.swarm("actualizePin", newPin);
			});
		},

	})
}

function doAddCsb(aliasCSB) {
	is.startSwarm("createCsb", "start", aliasCSB).on({
		readPin:function(noTries){
			var self = this;
			utils.insertPassword(null, noTries, function (err, pin) {
				self.swarm("validatePin", pin, noTries);
			});
		}
	});
}

function doSetKey(aliasCsb, recordType, key, field) {
	is.startSwarm("setKey", "start", aliasCsb, recordType, key, field).on({
		readPin: function(aliasCsb, recordType, key, field, noTries){
			var self = this;
			utils.insertPassword(null, noTries, function (err, pin) {
				self.swarm("validatePin", pin, aliasCsb, recordType, key, field, noTries);
			});
		},
		readStructure: function (pin, aliasCsb, recordType, key, field) {
			var self = this;
			utils.getRecordStructure(recordType, function (err, recordStructure) {
				if(err){
					throw err;
				}
				var fields = recordStructure["fields"];
				self.swarm("checkInputValidity", pin, aliasCsb, recordType, key, field, fields);
			});
		},
		printError: function () {
			console.log("Invalid input");
		}
	});
}

function doResetPin(){
	is.startSwarm("resetPin", "start").on({
		readSeed :function(){
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
		}
	})
}
doGetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.start("flows.getKey").start(aliasCsb, recordType, key, field);
};

doSaveBackup = function (url) {
	is.startSwarm("saveBackup", "start", url).on({
		readPin: function (noTries) {
			var self = this;
			utils.insertPassword("Insert pin:", noTries, function (err, pin) {
				self.swarm("validatePin", pin, noTries);
			})
		},
		errorOnPost: function () {
			console.log("Failed on post");
		},
		onComplete: function () {
			console.log("All resources are backedUp");
		},
		printError: function (err) {
			throw err;
		}
	});
};


doRestore = function (aliasCsb) {
	$$.flow.start("flows.restore").start(aliasCsb);
};

function doSetUrl(url) {
	is.startSwarm("setUrl", "start", url).on({
		readPin: function (noTries) {
			var self = this;
			utils.insertPassword("Insert pin:", noTries, function (err, pin) {
				self.swarm("validatePin", pin, noTries);
			})
		},
		printError: function () {
			console.log("InvalidUrl");
		},
		confirmOverwriteRecord: function (csb, recordType, key, field, fields) {
			var self = this;
			console.log("You are about to overwrite the following record:");
			console.log($$.swarm.start("getUrl").__getRecord(csb, recordType, key));
			utils.confirmOperation("Do you want to continue?", null, function(err, rl){
				utils.enterRecord(fields, 0, null, rl, function (err, record) {
					if(err){
						throw err;
					}
					self.swarm("addRecord", record, csb, recordType, key, field);
				});
			});
		},

		confirmOverwriteField: function (csb, recordType, key, field) {
			var self = this;
			console.log("You are about to overwrite the following field:");
			console.log($$.swarm.start("getUrl").__getRecord(csb, recordType, key, field));
			utils.confirmOperation(null, null, function(err, rl){
				if(err){
					throw err;
				}
				utils.enterField(field, rl, function(err, answer){
					if(err){
						throw err;
					}
					self.swarm("addRecord", answer, csb, recordType, key, field);
				})
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
		onComplete: function () {
			console.log("Done");
		}
	});
}

function doGetUrl(url) {
	is.startSwarm("getUrl", "start", url, function(err, result){
		console.log(result);
	}).on({
		readPin: function (noTries) {
			var self = this;
			utils.insertPassword("Insert pin:", noTries, function (err, pin) {
				self.swarm("validatePin", pin, noTries);
			})
		},
		printError: function () {
			console.log("InvalidUrl");
		},
		printRecord: function (record) {
			console.log(record);
			this.swarm("checkoutResult", record);
		}
	});
}

function doAddFile(csbUrl, filePath) {
	is.startSwarm("addFile", "start", csbUrl, filePath).on({
		readPin: function (noTries) {
			var self = this;
			utils.insertPassword("Insert pin:", noTries, function (err, pin) {
				self.swarm("validatePin", pin, noTries);
			})
		},
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
		invalidNoArguments: function () {
			console.log("Invalid number of arguments");
		},
		invalidUrl: function () {
			console.log("Invalid url");
		},
		printError: function (err) {
			throw err;
		}
	});
}

doAddFolder = function(csbUrl, folderPath){
	$$.flow.start("flows.addFile").start(csbUrl, folderPath);
};

doExtract = function(url){
	$$.flow.start("flows.extract").start(url);
};

doListCsbs = function (aliasCsb) {
	$$.flow.start("flows.listCsbs").start(aliasCsb);
};

doPrintCsb = function (aliasCsb) {
	$$.flow.start("flows.printCsb").start(aliasCsb);
};

doCopyUrl = function (sourceUrl, destUrl) {
	$$.flow.start("flows.copyUrl").start(sourceUrl, destUrl);
};

doDeleteUrl = function (url) {
	$$.flow.start("flows.deleteUrl").start(url);
};

doMoveUrl = function (sourceUrl, destUrl) {
	$$.flow.start("flows.moveUrl").start(sourceUrl, destUrl);
};


addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCsb, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
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
addCommand("copy", "url", doCopyUrl, "<srcUrl> <destUrl> \t |move the csb <aliasCsb> from <srcAlias> to <destAlias>");
addCommand("delete", "url", doDeleteUrl, "<url>");
addCommand("move", "url", doMoveUrl, "<srcUrl> <destUrl>");
