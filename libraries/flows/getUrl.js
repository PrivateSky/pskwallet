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
		if(!args){
			console.log("Invalid Url");
			return;
		}
		args.shift();
		args.unshift(pin);
		this.getRecord(...args);

	},
	getRecord: function (pin,csb, aliasCsb, recordType, key, field) {
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