const utils = require("./../../utils/flowsUtils");


$$.swarm.describe("move", {
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
				self.moveRecord(pin, self.sourceUrl, self.destUrl);
			}
		})
	},
	moveRecord: function (pin, sourceUrl, destUrl) {
		$$.swarm.start("flows.copy").processUrl(pin, sourceUrl, destUrl);
		$$.swarm.start("flows.delete").processUrl(pin, sourceUrl);
		this.swarm("interaction", "printInfo", "Success");
	}
});