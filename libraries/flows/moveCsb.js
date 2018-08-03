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

		utils.requirePin([aliasCsb, aliasCsbSource, aliasCsbDest], null, this.moveCsb)
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
		var indexCsb = utils.indexOfRecord(csbSource.data, "Csb", aliasCsb);
		if(indexCsb < 0){
			console.log(aliasCsbSource, "does not contain the csb", aliasCsb);
			return;
		}
		var csb = csbSource.data["records"]["Csb"][indexCsb];
		csbSource.data["records"]["Csb"].splice(indexCsb, 1);
		if(!csbDest.data["records"]){
			csbDest.data["records"] = {};
		}
		if(!csbDest.data["records"]["Csb"]){
			csbDest.data["records"]["Csb"] = [];
		}
		csbDest.data["records"]["Csb"].push(csb);

		utils.writeCsbToFile(csbSource.path, csbSource.data, csbSource.dseed);
		utils.writeCsbToFile(csbDest.path, csbDest.data, csbDest.dseed);

		console.log(aliasCsb, "was moved from", aliasCsbSource, "to", aliasCsbDest);
	}
});