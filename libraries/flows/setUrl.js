var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url);
		});
	},
	processUrl: function (pin, url) {
		var masterCsb = utils.readMasterCsb(pin);
		var args = utils.traverseUrl(pin, masterCsb.Data, url);
		var parentCsbData = args[0];
		var index = utils.indexOfRecord(parentCsbData, "Csb", args[1]);
		if(index < 0){
			console.log("Csb", args[1], "does not exist");
			return;
		}
		var csb = {};
		csb["Path"] = parentCsbData["records"]["Csb"][index].Path;
		csb["Dseed"] = parentCsbData["records"]["Csb"][index].Dseed;
		csb["Data"] = utils.readCsb(csb.Path, Buffer.from(csb.Dseed, "hex"));
		args.shift();
		args.unshift(pin);
		args.unshift(csb);
		this.readStructure(...args);
	},
	readStructure: function (csb, pin, aliasCsb, recordType, key, field) {
		var recordStructure = utils.getRecordStructure(recordType);
		var fields = recordStructure["fields"];
		$$.flow.create("flows.setKey").checkInputValidity(pin, aliasCsb, recordType, key, field, fields, csb);
	}
	
});