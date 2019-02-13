$$.loadLibrary("flows", require("../flows"));
const is = require("interact").createInteractionSpace();
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
	return function(err, info = '', isWarning){
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
        readPin: function (noTries) {
            if (noTries < 3 && noTries > 0) {
                console.log("Invalid pin");
                console.log("Try again");
            }
            utils.insertPassword("Insert pin:", noTries, (err, pin) => {
                this.swarm("validatePin", pin, noTries);
            })
        },
        createPin: function (defaultPin) {
            this.swarm("createMasterCSB", defaultPin);
        },
		printInfo: generateMessagePrinter(),
		printSensitiveInfo: function (seed, defaultPin) {
			console.log("The following string represents the seed. Please save it.\n");
			console.log(seed.toString(), '\n');
			console.log("The default pin is:", defaultPin, '\n');
		}
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

function doSaveBackup(CSBPath) {
	is.startSwarm("saveBackup", "start", CSBPath).on({
		readPin: readPin,
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
		handleError: generateErrorHandler()
	});
}

function doAttachFile(url, filePath) {
	is.startSwarm("attachFile", "start", url, filePath).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler()
	})
}


function doExtractFile(url){
	is.startSwarm("extractFile", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError:generateErrorHandler()
	});
}

function doListCSBs(CSBPath) {
	is.startSwarm("listCSBs", "start", CSBPath).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler(),
		__return__ : function (csbAliases) {
			console.log(csbAliases);
		}
	})
}

addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doCreateCsb, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("save", "backup", doSaveBackup,"<url>\t\t\t\t |saveData all csbs at address <url>");
addCommand("clone", null, doClone, "<alias>\t\t\t\t |restore the csb  or archive having the name <alias> from one \n\t\t\t\t\t\t\t  of the addresses stored in backup\n");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("extract", "file", doExtractFile, "<csbUrl> <alias> \t\t\t |decrypt file/folder/csb having the alias <alias>, contained\n\t\t\t\t\t\t\t   by the csb pointed to by <csbUrl>\n");
addCommand("list", "csbs", doListCSBs, "<aliasCsb> \t\t\t\t |show all child csbs in the csb <aliasCsb>; if <aliasCsb> \n\t\t\t\t\t\t\t  is not provided, the command will print all the csbs \n\t\t\t\t\t\t\t  in the current folder\n");
addCommand("attach", "file", doAttachFile, "<url> <filePath>\t\t\t |add file <filepath> to pskdb pointed by <url>");
