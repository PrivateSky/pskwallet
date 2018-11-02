const utils = require("./../../utils/flowsUtils");

$$.swarm.describe("copy", {
	start: function (sourceUrl, destUrl) {
		this.sourceUrl = sourceUrl;
		this.destUrl = destUrl;
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.processUrl(pin, self.sourceUrl, self.destUrl);
			}
		})
	},
	processUrl: function (pin, sourceUrl, destUrl) {
		var self = this;
		$$.swarm.start("flows.getUrl").processUrl(pin, sourceUrl, function (err, srcRecord) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed in get url");
				return;
			}
			utils.traverseUrl(pin, destUrl, function (err, destArgs) {
				if(err){
					self.swarm("interaction", "handleError", err, "Failed to traverse url " + destUrl);
					return;
				}
				var parentCsb = destArgs.shift();
				utils.getChildCsb(parentCsb, destArgs.shift(), function (err, csb) {
					if(err){
						self.swarm("interaction", "handleError", err, "Failed in get url");
						return;
					}
					destArgs.unshift(csb);
					destArgs.unshift(srcRecord);
					for(let i=0; i < 6 - destArgs.length; i++){
						destArgs.push(null);
					}
					destArgs.push(function (err) {
						if(err){
							self.swarm("interaction", "handleError", err, "Failed to add record to csb");
							return;
						}
						self.swarm("interaction", "printInfo", "Successfully copied");
					});
					utils.addRecord(...destArgs);
				});

			});
		});
	}
});