var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));


$$.flow.describe("moveUrl", {
	start: function (sourceUrl, destUrl) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.moveRecord(pin, sourceUrl, destUrl);
		})
	},
	moveRecord: function (pin, sourceUrl, destUrl) {
		$$.flow.create("flows.copyUrl").processUrl(pin, sourceUrl, destUrl);
		$$.flow.create("flows.deleteUrl").processUrl(pin, sourceUrl);
	}
});