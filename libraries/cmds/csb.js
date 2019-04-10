$$.loadLibrary("flows", require("../flows"));
const is = require("interact").createInteractionSpace();
const utils = require('../../utils/consoleUtils');

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


function doAddBackup(backupUrl, localFolder) {
	is.startSwarm("addBackup", "start", backupUrl, localFolder).on({
		readPin: readPin,
		createPin: function(defaultPin){
			this.swarm('addBackup', defaultPin);
		},
		handleError: generateErrorHandler(),
		printInfo: generateMessagePrinter()
	})
}

function doSetPin() {
	is.startSwarm("setPin", "start").on({
		readPin: readPin,
		enterNewPin: function () {
			utils.insertPassword("Insert new pin:", 3, (err, newPin)=>{
				this.swarm("actualizePin", newPin);
			});
		},
		handleError: generateErrorHandler(),
		printInfo: generateMessagePrinter()
	})
}


function doResetPin() {
	is.startSwarm("resetPin", "start").on({
		readSeed: function (noTries) {
			utils.insertPassword("Enter seed:", noTries, (err, seed) =>{
				if (err) {
					throw err;
				}
				if(noTries < 3 && noTries > 0){
					console.log("Invalid pin");
					console.log("Try again");
				}

				this.swarm("validateSeed", seed, noTries);
			});
		},

		insertPin: function (noTries) {
			utils.insertPassword("Insert new pin:", noTries, (err, newPin)=>{
				this.swarm("actualizePin", newPin);
			});
		},
		handleError: generateErrorHandler(),
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
		handleError: generateErrorHandler(),
        createPin: function (defaultPin) {
            this.swarm("loadBackups", defaultPin);
        },
		printInfo: generateMessagePrinter(),
		printSensitiveInfo: function (seed, defaultPin) {
			console.log("The following string represents the seed. Please save it.\n");
			console.log(seed.toString(), '\n');
			console.log("The default pin is:", defaultPin, '\n');
		}
	});
}

function doSaveBackup(CSBPath) {
	is.startSwarm("saveBackup", "start", CSBPath).on({
		readPin: readPin,
		handleError: generateErrorHandler(),
		csbBackupReport: function({errors, successes}) {
			if(!errors && !successes) {
				console.log('All CSBs are already backed up');
			}

			if(Array.isArray(errors)) {
				errors.forEach(({alias, backupURL}) => {
					console.log(`Error while saving file ${alias} on ${backupURL}`);
				});
			}

			if(Array.isArray(successes)) {
				successes.forEach(({alias, backupURL}) => {
					console.log(`Successfully backed up file ${alias} on ${backupURL}`);
				});
			}

		}
	});
}


function doRestore(CSBPath) {
	is.startSwarm("restore", "start", CSBPath).on({
		readSeed: function () {
			utils.insertPassword("Enter seed:", 3, (err, seed) =>{
				if (err) {
					throw err;
				}
				this.swarm("restoreCSB", seed);
			});
		},
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler(),
		printSensitiveInfo: function (seed, defaultPin) {
			console.log("The following string represents the seed. Please save it.\n");
			console.log(seed.toString(), '\n');
			console.log("The default pin is:", defaultPin, '\n');
		},
		readPin: readPin
	});
}

function doAttachFile(url, filePath) {
	is.startSwarm("attachFile", "start", url, filePath).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler(),
		reportProgress: function (progress) {
			console.log("progress:", progress.toFixed(2));
		}
	})
}


function doExtractFile(url){
	is.startSwarm("extractFile", "start", url).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError:generateErrorHandler(),
        reportProgress: function (progress) {
            console.log("progress:", progress.toFixed(2));
        },
		__return__: function (fileNames) {
			//TODO process fileNames in browser
		}
	});
}

function doListCSBs(CSBPath, localFolder) {
	is.startSwarm("listCSBs", "start", CSBPath, localFolder).on({
		readPin: readPin,
		printInfo: generateMessagePrinter(),
		handleError: generateErrorHandler(),
		__return__ : function (csbAliases) {
			console.log(csbAliases);
		},
        noMasterCSBExists:function(){
			console.log("No master CSB exists")
		}
	})
}

function doReceive(endpoint, channel) {
	is.startSwarm("receive", "start", endpoint, channel).on({
		readPin: readPin,
		handleError: generateErrorHandler(),
		printSensitiveInfo: function (seed) {
			console.log("The following string represents the seed. Please save it.\n");
			console.log(seed.toString(), '\n');
		}
	})
}

function doPeriodicBackup(seed){
	setInterval(() => {
		is.startSwarm("saveBackup", "withSeed", seed).on({
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
		})
	}, 5000);
}

addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("add", "backup", doAddBackup, "<backupUrl> <localFolder> \t\t |add a new backupUrl to the existent list of backups"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("create", "csb", doCreateCsb, "<url> <localFolder>\t\t\t |create a new CSB at <url>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("save", "backup", doSaveBackup,"<url>\t\t\t\t |saveData all csbs at address <url>");
addCommand("restore", null, doRestore, "<url>\t\t\t\t\t |restore the backed up CSBs and attach them at CSB at <url>");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("extract", "file", doExtractFile, "<url> \t\t\t\t |decrypt file/folder at <url> ");
addCommand("list", "csbs", doListCSBs, "<url> \t\t\t\t |show all child csbs in the CSB at <url>; if <url> is not provided, the command will print the child CSBs of masterCSB");
addCommand("attach", "file", doAttachFile, "<url> <filePath>\t\t\t |add file <filepath> to CSB at <url>");
addCommand("receive", null, doReceive, "<endpoint> <channel>\t\t\t |wait for seed at endpoint <endpoint> on channel <channel>");
addCommand("auto", 'backup', doPeriodicBackup, "<seed> \t\t\t\t |wait for seed at endpoint <endpoint> on channel <channel>");
