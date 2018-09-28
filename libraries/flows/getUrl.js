var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");

$$.flow.describe("getUrl", {
	start: function (url, callback) {// url = alias1/alias2/.../aliasn/recordType/key/field
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, url, function(err, record){
				if (record) {
					if(!callback) {
						$$.interact.say(record);
					}else{
						callback(null, record);
					}
				}
			});
		});
	},
	processUrl: function (pin, url, callback) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(!err) {
				if (!args) {
					$$.interact.say("Invalid Url");
					return;
				}
				var parentCsb = args.shift();
				utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
					if(!err){
						args.unshift(csb);
						var record = self.__getRecord(...args);
						callback(null, record);
					}
				});
			}
		});
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