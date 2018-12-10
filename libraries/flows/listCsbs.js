var path = require("path");
const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
var fs = require("fs");

$$.swarm.describe("listCsbs", {
	start: function (aliasCsb) {
		this.aliasCsb = aliasCsb;
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		// console.log("validatePin", noTries);
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				if(err.code ==='ENOENT'){
				//TODO add a wrapper to err in order to be able to post it through window.postMessage
                self.swarm("interaction", "handleError", err.code, "No master csb");
				}
				else{
                 self.swarm("interaction", "readPin", noTries-1);
                }
			}else {
				self.getCsb(pin, self.aliasCsb);
			}
		})
	},
	getCsb: function (pin, aliasCsb) {
		var self = this;

		if(!aliasCsb){
			utils.loadMasterCsb(pin, null, function (err, masterCsb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to load master csb");
					return;
				}
				self.__processCsb(masterCsb);
			});
		}else{
			utils.getCsb(pin, aliasCsb, function (err, csb) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to get csb " + aliasCsb);
					return;
				}
				self.__processCsb(csb);
			});
		}
	},
	__processCsb: function (csb) {
		if(csb.Data["records"] && csb.Data["records"]["Csb"] && csb.Data["records"]["Csb"].length){
			var csbs = csb.Data["records"]["Csb"];
			this.swarm("interaction", "printCsb", csbs, 0);
		}else{
			this.swarm("interaction", "printInfo", "No csb exists");
		}
	},
	listCsbs: function (csbs, currentCsb) {
		var self = this;
		var csb = csbs[currentCsb];
		utils.readDecryptedCsb(csb.Path, csb.Dseed, function (err, csbData) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to read decrypted csb " + csb.Title);
				return;
			}
			if (csbData["records"] && csbData["records"]["Csb"]) {
				// self.swarm("interaction", "printInfo", csb.Title);
				csbs = csbs.concat(csbData["records"]["Csb"]);
			}
			self.swarm("interaction", "printCsb", csbs, currentCsb);
		});
	},
	loadCsb: function (csb, csbs, currentCsb) {
		utils.readDecryptedCsb(csb.Path, csb.Dseed, function (err, csbData) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to read decrypted csb " + csb.Title);
				return;
			}
			if (csbData["records"] && csbData["records"]["Csb"]) {
				// self.swarm("interaction", "printInfo", csb.Title);
				csbs = csbs.concat(csbData["records"]["Csb"]);
			}
		});
	}
});