$$.loadLibrary("flows", require("../flows"));
var is = require("interact").createInteractionSpace();
const utils = require('../../utils/consoleUtils');
const path = require("path");

function readPin(noTries) {
	if(noTries < 3 && noTries > 0){
		console.log("Invalid pin");
		console.log("Try again");
	}
	utils.insertPassword("Insert pin:", noTries, (err, pin) => {
		this.swarm("validatePin", pin, noTries);
	})
}

function generateErrorHandler(){
	return function(err, info, isWarning){
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
		readPin: readPin,
		enterNewPin: function () {
			utils.insertPassword("Insert new pin:", 3, (err, newPin)=>{
				this.swarm("actualizePin", newPin);
			});
		},
		printInfo: generateMessagePrinter()
	})
}

function doCreateCsb(CSBPath) {
	is.startSwarm("createCsb", "start", CSBPath).on({
		readPin: function (noTries, defaultPin, isFirstCall) {
			if(isFirstCall){
				this.swarm("createMasterCSB", defaultPin);
			}else {
				if (noTries < 3 && noTries > 0) {
					console.log("Invalid pin");
					console.log("Try again");
				}
				utils.insertPassword("Insert pin:", noTries, (err, pin) =>{
					this.swarm("validatePin", pin, noTries);
				})
			}
		},
		printInfo: generateMessagePrinter(),
		printSensitiveInfo: function (seed, defaultPin) {
			console.log("The following string represents the seed. Please save it.\n");
			console.log(seed.toString(), '\n');
			console.log("The default pin is:", defaultPin, '\n');
		}
	});
}

function doSetKey(aliasCsb, recordType, key, field) {
	is.startSwarm("setKey", "start", aliasCsb, recordType, key, field).on({
		readPin:readPin,
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
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}
function doGetKey(aliasCsb, recordType, key, field) {
	$$.flow.start("flows.getKey").start(aliasCsb, recordType, key, field);
}

function doSaveBackup(CSBPath) {
	is.startSwarm("saveBackup", "start", CSBPath).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler(),
		csbBackupReport: function({errors, successes}) {
			if(errors.length === 0 && successes.length === 0) {
				console.log('All CSBs are already backed up');
			}

			errors.forEach(({alias, backupURL}) => {
				console.log(`Error while saving file ${alias} on ${backupURL}`);
			});

			successes.forEach(({alias, backupURL}) => {
				console.log(`Successfully backed up file ${alias} on ${backupURL}`);
			});
		}
	});
}


function doClone(CSBPath) {
	is.startSwarm("clone", "start", CSBPath).on({
		readSeed: function () {
			utils.insertPassword("Enter seed:", 3, (err, seed) =>{
				if (err) {
					throw err;
				}
				this.swarm("restoreMaster", seed);
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler
	});
}

function doSetUrl(url) {
	is.startSwarm("setUrl", "start", url).on({
		readPin: readPin,
		confirmOverwrite: function (recordType, key, field, fields, overWrittenRecord) {
			var self = this;

			function generateConfirmationCb(){
				return function (err, record) {
					if(err){
						$$.errorHandler.throwError(err);
					}else{
						self.swarm("addRecord", record, recordType, key, field);
					}
				}
			}
			if(field){
				console.log("You are about to overwrite the following field:");
			}else{
				console.log("You are about to overwrite the following record:");
			}
			console.log(overWrittenRecord);
			utils.confirmOperation("Do you want to continue?", null, function(err, rl){
				if(field){
					utils.enterField(field, rl, generateConfirmationCb());
				}else{
					utils.enterRecord(fields, 0, null, rl, generateConfirmationCb());
				}

			});
		},
		enterRecord: function (recordType, key, field, fields) {
			var self = this;
			utils.enterRecord(fields, 0, null, null, function (err, record) {
				if(err){
					throw err;
				}
				self.swarm("addRecord", record, recordType, key, field);
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
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
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	});
}

function doAddFolder(csbUrl, folderPath){
	doAddFile(csbUrl, folderPath);
}

function doExtract(url){
	is.startSwarm("extract", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError:generateErrorHandler()
	});
}

function doListCsbs(aliasCsb) {
	is.startSwarm("listCsbs", "start", aliasCsb).on({
		readPin: readPin,
		printCsb: function (csbs, currentCsb) {
			console.log(csbs[currentCsb].Title);
			if(currentCsb < csbs.length - 1){
				this.swarm("listCsbs", csbs, currentCsb + 1)
			}
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
};


function doCopy(sourceUrl, destUrl) {
	is.startSwarm("copy", "start", sourceUrl, destUrl).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}

function doDelete(url) {
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
}

function doMove(sourceUrl, destUrl) {
	is.startSwarm("move", "start", sourceUrl, destUrl).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}

function doAddPskdb(url) {
	is.startSwarm("addPskdb", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	});
}

function doAddFileToPskdb(url, filePath) {
	is.startSwarm("attachFile", "start", url, filePath).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}

function doExtractFromPskdb(url) {
	is.startSwarm("extractTemp", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}

addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doCreateCsb, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("set", "key", doSetKey, "<aliasCsb> <recordType> <key> <field>   |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<aliasCsb> <recordType> <key> <field>   |get the key " ); //citeste o cheie intr-un csb
addCommand("save", "backup", doSaveBackup,"<url>\t\t\t\t |saveData all csbs at address <url>");
addCommand("clone", null, doClone, "<alias>\t\t\t\t |restore the csb  or archive having the name <alias> from one \n\t\t\t\t\t\t\t  of the addresses stored in backup\n");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("set", "url", doSetUrl, "<url> \t\t\t\t\t |set/update the record/field pointed by the provided <url>");
addCommand("get", "url", doGetUrl, "<url> \t\t\t\t\t |print the record/field indicated by te provided <url>");
addCommand("add", "file", doAddFile, "<csbUrl> <filePath> \t\t\t |add a file to the csb pointed by <csbUrl>");
addCommand("add", "folder", doAddFile, "<csbUrl> <folderPath> \t\t |add a folder to the csb pointed by <csbUrl>");
addCommand("extract", null, doExtract, "<csbUrl> <alias> \t\t\t |decrypt file/folder/csb having the alias <alias>, contained\n\t\t\t\t\t\t\t   by the csb pointed to by <csbUrl>\n");
addCommand("list", "csbs", doListCsbs, "<aliasCsb> \t\t\t\t |show all child csbs in the csb <aliasCsb>; if <aliasCsb> \n\t\t\t\t\t\t\t  is not provided, the command will print all the csbs \n\t\t\t\t\t\t\t  in the current folder\n");
addCommand("copy", null, doCopy, "<srcUrl> <destUrl> \t\t\t |copy the csb/record/field from <srcUrl> to <destUrl>");
addCommand("delete", null, doDelete, "<url>\t\t\t\t\t |delete the csb/record/field pointed to by <url>");
addCommand("move", null, doMove, "<srcUrl> <destUrl>\t\t\t |move the csb/record/field from <srcUrl> to <destUrl>");
addCommand("add", "pskdb", doAddPskdb, "<url> \t\t\t |add a pskdb to csb pointed by <url>");
addCommand("attach", "file", doAddFileToPskdb, "<url> <filePath>\t\t\t |add file <filepath> to pskdb pointed by <url>");
addCommand("extra", "temp", doExtractFromPskdb, "<url> \t\t\t |extract asset referenced by <url> from pskdb inside of csb");
