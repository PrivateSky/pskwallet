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
		var args = utils.traverseUrl(pin, url);
		if(!args){
			console.log("Invalid Url");
			return;
		}
		var parentCsb = args.shift();
		var csb = utils.getChildCsb(parentCsb, args.shift());
		args.unshift(csb);
		args.unshift(pin);
		var record = this.__getRecord(...args);
		if(record){
			console.log(record);
		}
		return record;

	},
	__getRecord: function (pin, csb, recordType, key, field) {
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