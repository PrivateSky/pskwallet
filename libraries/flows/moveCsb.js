var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
var fs = require("fs");

$$.flow.describe("moveCsb", {
	start: function (aliasCsb, aliasCsbSource, aliasCsbDest) {
		if(!aliasCsbDest){
			console.log("Invalid number of arguments");
			return;
		}
		if(aliasCsb === "master"){
			console.log("Master csb can't be moved");
			return;
		}
		if(aliasCsbSource === aliasCsbDest){
			console.log("Source and destination are the same");
			return;
		}
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.moveCsb(pin, aliasCsb, aliasCsbSource, aliasCsbDest);
		})
	},
	moveCsb: function (pin, aliasCsb, aliasCsbSource, aliasCsbDest) {
		var csbSource,
			csbDest;

		if(aliasCsbSource === "master"){
			csbSource = utils.readMasterCsb(pin);
		}else {
			csbSource = utils.getCsb(pin, aliasCsbSource);
		}

		if(aliasCsbDest === "master"){
			csbDest = utils.readMasterCsb(pin);
		}else {
			csbDest = utils.getCsb(pin, aliasCsbDest);
		}
		if(!csbSource){
			console.log(csbSource, "does not exist");
			return;
		}
		if(!csbDest){
			console.log(csbDest, "does not exist");
			return;
		}
		var indexCsb = utils.indexOfRecord(csbSource.Data, "Csb", aliasCsb);
		if(indexCsb < 0){
			console.log(aliasCsbSource, "does not contain the csb", aliasCsb);
			return;
		}
		var csb = csbSource.Data["records"]["Csb"][indexCsb];
		csbSource.Data["records"]["Csb"].splice(indexCsb, 1);
		if(!csbDest.Data["records"]){
			csbDest.Data["records"] = {};
		}
		if(!csbDest.Data["records"]["Csb"]){
			csbDest.Data["records"]["Csb"] = [];
		}
		csbDest.Data["records"]["Csb"].push(csb);

		utils.writeCsbToFile(csbSource.Path, csbSource.Data, csbSource.Dseed);
		utils.writeCsbToFile(csbDest.Path, csbDest.Data, csbDest.Dseed);

		console.log(aliasCsb, "was moved from", aliasCsbSource, "to", aliasCsbDest);
	}
});