var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.flow.describe("getKey", {
	start: function (aliasCsb, recordType, key, field) {
		if(!key){
			$$.interact.say("A key should be provided");
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
			$$.interact.say("No csb with the alias", aliasCsb, "exists");
			return;
		}

		var indexKey = utils.indexOfKey(csb.Data["records"][recordType], "Title", key);
		if (indexKey >= 0) {
			if (!field) {
				$$.interact.say(csb.Data["records"][recordType][indexKey]);
			} else if (csb["records"][recordType][indexKey][field]) {
				$$.interact.say(csb.Data["records"][recordType][indexKey][field]);
			} else {
				$$.interact.say("The record type", recordType, "does not have a field", field);
			}
		} else {
			$$.interact.say("No record having the key", key, "exists in", aliasCsb);
		}
	}
});