var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("getKey", {
	start: function (aliasCsb, recordType, key, field) {
		if(!key){
			console.log("A key should be provided");
			return;
		}
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.getKey(pin, aliasCsb, recordType, key, field);
		});
	},
	getKey: function (pin, aliasCsb, recordType, key, field) {
		var csb = utils.getCsb(pin, aliasCsb);
		if (!csb) {
			console.log("No csb with the alias", aliasCsb, "exists");
			return;
		}

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