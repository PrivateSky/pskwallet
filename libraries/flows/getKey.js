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
			self.getKey(pin, aliasCsb, recordType, key, field, function (err) {
				if(err) throw err;
			});
		});
	},
	getKey: function (pin, aliasCsb, recordType, key, field, callback) {
		utils.getCsb(pin, aliasCsb, function (err, csb) {
			if(err){
				return callback(err);
			}
			if (!csb) {
				$$.interact.say("No csb with the alias", aliasCsb, "exists");
				return;
			}
			var indexKey = utils.indexOfKey(csb.Data["records"][recordType], "Title", key);
			if (indexKey >= 0) {
				if (!field) {
					$$.interact.say(csb.Data["records"][recordType][indexKey]);
					callback(null, csb.Data["records"][recordType][indexKey]);
				} else if (csb["records"][recordType][indexKey][field]) {
					$$.interact.say(csb.Data["records"][recordType][indexKey][field]);
					callback(null, csb.Data["records"][recordType][indexKey][field]);
				} else {
					$$.interact.say("The record type", recordType, "does not have a field", field);
				}
			} else {
				$$.interact.say("No record having the key", key, "exists in", aliasCsb);
			}
		});
	}
});