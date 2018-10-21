$$.loadLibrary("flows", require("../flows"));
const is = require("interact").createInteractionSpace();
const utils = require('../utils/utils')
const getPassword = require("../utils/getPassword").readPassword;
doSetPin = function () {
	is.startSwarm("setPin", "start").on({
		enterOldPin: function () {
			var self = this;
			utils.requirePin("Enter old pin:", function (err, oldPin) {
				console.log(self);
				self.swarm("requestNewPin", oldPin, function (err) {
					if(err){
						throw err;
					}
				});
			});
		},
		enterNewPin: function (oldPin, callback) {
			oldPin = oldPin || utils.defaultPin;
			var self = this;
			getPassword("Insert new pin:", function(err, newPin){
				if(err){
					console.log("An invalid character was introduced. Try again:")
					self.enterNewPin(oldPin, callback);
				}else{
					self.swarm("actualizePin", oldPin, newPin, callback);
				}
			});
		},

	})
};

doAddCSB = function (aliasCSB) {
	is.startSwarm("createCsb", "start", aliasCSB).on({
		readPin:function(aliasCsb, noTries){
			console.log("interaction read pin");
			if(noTries == 0){
				console.log("You inserted an invalid pin three times");
				return;
			}
			var self = this;
			getPassword(null, function (err, pin) {
				if(err){
					console.log("You inserted an invalid pin");
					self.readPin(noTries-1);
				}else{
					self.swarm("validatePin", pin, aliasCSB, noTries);
				}
			})
		}
	});
};

doPrintCsb = function (aliasCsb) {
	$$.flow.start("flows.printCsb").start(aliasCsb);
};

doSetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.start("flows.setKey").start(aliasCsb, recordType, key, field);
};

doGetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.start("flows.getKey").start(aliasCsb, recordType, key, field);
};

doAddBackup = function (url) {
	$$.flow.start("flows.addBackup").start(url);
};

doResetPin = function(){
	$$.flow.start("flows.resetPin").start();
};

doRestore = function (aliasCsb) {
	$$.flow.start("flows.restore").start(aliasCsb);
};

doSetUrl = function (url) {
	$$.flow.start("flows.setUrl").start(url);
};

doGetUrl = function (url) {
	$$.flow.start("flows.getUrl").start(url);
};

doAddFile = function(csbUrl, filePath){
	$$.flow.start("flows.addFile").start(csbUrl, filePath);
};

doAddFolder = function(csbUrl, folderPath){
	$$.flow.start("flows.addFile").start(csbUrl, folderPath);
};

doExtract = function(url){
	$$.flow.start("flows.extract").start(url);
};

doListCsbs = function (aliasCsb) {
	$$.flow.start("flows.listCsbs").start(aliasCsb);
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
addCommand("create", "csb", doAddCSB, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("print", "csb", doPrintCsb, "<aliasCsb>\t\t\t\t |print the CSB having the alias <aliasCsb>");
addCommand("set", "key", doSetKey, "<aliasCsb> <recordType> <key> <field>   |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<aliasCsb> <recordType> <key> <field>   |get the key " ); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>\t\t\t\t |save all csbs at address <url>");
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
