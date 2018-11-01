var path = require("path");

const utils = require("./../../utils/flowsUtils");
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
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.processUrl(pin, self.url, function (err, record) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed to process url");
						return;
					}
					self.checkoutResult(record);

				});
			}
		})
	},
	processUrl: function (pin, url, callback) {
		var self = this;
		utils.traverseUrl(pin, url, function (err, args) {
			if(err){
				return callback(err);
			}
			if (!args) {
				self.swarm("interaction", "handleError", null, "Invalid url", true);
				return;
			}
			var parentCsb = args.shift();
			utils.getChildCsb(parentCsb, args.shift(), function (err, csb) {
				if(err){
					return callback(err);
				}
				args.unshift(csb);
				var record = utils.getRecord(...args);
				if(!record){
					self.swarm("interaction", "handleError", null, "The provided record does not exist", true);
					return;
				}
				callback(null, record);

			});
		});
	},

	checkoutResult: function (record) {
		if(this.callback){
			this.callback(null, record);
		}
	}
});