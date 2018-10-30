var path = require("path");

const utils = require(path.resolve(__dirname + "/../../utils/flowsUtils"));
const crypto = require("pskcrypto");

$$.swarm.describe("getUrl", {
	start: function (url, callback) {
		this.url = url;
		this.callback = callback;
		this.swarm("interaction", "readPin", 3);
	},
	readPin: "interaction",

	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err, status) {
			if(err){
				console.log("Pin is invalid");
				console.log("Try again");
				self.swarm("interaction", "readPin", noTries-1);
			}else{
				self.processUrl(pin);
			}
		})
	},
	processUrl: function (pin) {
		var self = this;
		utils.traverseUrl(pin, this.url, function (err, args) {
			if(!err) {
				if (!args) {
					self.swarm("interaction", "printError");
				}
				var parentCsb = args.shift();
				utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
					if(!err){
						args.unshift(csb);
						var record = self.__getRecord(...args);
						self.swarm("interaction", "printRecord", record);
					}
				});
			}
		});
	},
	printError: "interaction",
	printRecord: "interaction",

	checkoutResult: function (record) {
		if(this.callback){
			this.callback(null, record);
		}
	},

	__getRecord: function (csb, recordType, key, field) {
		var indexKey = utils.indexOfKey(csb.Data["records"][recordType], "Title", key);
		if (indexKey >= 0) {
			if (!field) {
				return csb.Data["records"][recordType][indexKey];
			} else if (csb.Data["records"][recordType][indexKey][field]) {
				return csb.Data["records"][recordType][indexKey][field];
			} else {
				return undefined;
			}
		} else {
			return undefined;
		}
	}
});