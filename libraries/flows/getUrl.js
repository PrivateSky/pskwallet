var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");

$$.flow.describe("getUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url);
		});
	},
	processUrl: function (pin, url) {
		var args = utils.traverseUrl(pin, url);
		if(!args){
			$$.interact.say("Invalid Url");
			return;
		}
		var parentCsb = args.shift();
		var csb = utils.getChildCsb(parentCsb, args.shift());
		args.unshift(csb);
		var record = this.__getRecord(...args);
		if(record){
			$$.interact.say(record);
		}
		return record;

	},
	__getRecord: function (csb, recordType, key, field) {
		var indexKey = utils.indexOfKey(csb.Data["records"][recordType], "Title", key);
		if (indexKey >= 0) {
			if (!field) {
				return csb.Data["records"][recordType][indexKey];
			} else if (csb["records"][recordType][indexKey][field]) {
				return csb.Data["records"][recordType][indexKey][field];
			} else {
				return undefined;
			}
		} else {
			return undefined;
		}
	}
});