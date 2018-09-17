var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));


$$.flow.describe("copyUrl", {
	start: function (sourceUrl, destUrl) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.processUrl(pin, sourceUrl, destUrl);
		})
	},
	processUrl: function (pin, sourceUrl, destUrl) {
		var srcRecord = $$.flow.create("flows.getUrl").processUrl(pin, sourceUrl);
		var destArgs = utils.traverseUrl(pin, destUrl);

		var parentCsb = destArgs.shift();
		var csb = utils.getChildCsb(parentCsb, destArgs.shift());
		destArgs.unshift(csb);
		destArgs.unshift(srcRecord);
		destArgs.unshift(pin);
		$$.flow.create("flows.setKey").addRecord(...destArgs);
	}
});