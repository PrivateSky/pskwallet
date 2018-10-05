var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));


$$.flow.describe("copyUrl", {
	start: function (sourceUrl, destUrl) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, sourceUrl, destUrl, function (err) {
				if(!err){
					throw err;
				}
			});
		})
	},
	processUrl: function (pin, sourceUrl, destUrl, callback) {
		$$.flow.start("flows.getUrl").processUrl(pin, sourceUrl, function (err, srcRecord) {
			if(err){
				callback(err);
				return;
			}
			utils.traverseUrl(pin, destUrl, function (err, destArgs) {
				if(!err){
					var parentCsb = destArgs.shift();
					utils.getChildCsb(parentCsb, destArgs.shift(), function (err, csb) {
						if(!err){
							destArgs.unshift(csb);
							destArgs.unshift(srcRecord);
							destArgs.unshift(pin);
							$$.flow.start("flows.setKey").addRecord(...destArgs, callback);
						}
					});

				}
			});
		});
	}
});