var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("getUrl", {
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
		this.getRecord(...args);

	},
	getRecord: function (csb, pin, aliasCsb, recordType, key, field) {
		var indexKey = utils.indexOfKey(csb.Data["records"][recordType], "Title", key);
		if (indexKey >= 0) {
			if (!field) {
				console.log(csb.Data["records"][recordType][indexKey]);
			} else if (csb["records"][recordType][indexKey][field]) {
				console.log(csb.Data["records"][recordType][indexKey][field]);
			} else {
				console.log("The record type", recordType, "does not have a field", field);
			}
		} else {
			console.log("No record having the key", key, "exists in", aliasCsb);
		}
	}
});