var path = require("path");

const utils = require("./../../utils/flowsUtils");


$$.flow.describe("moveUrl", {
	start: function (sourceUrl, destUrl) {
		var self = this;
		utils.requirePin(null, function (err, pin) {
			self.moveRecord(pin, sourceUrl, destUrl);
		})
	},
	moveRecord: function (pin, sourceUrl, destUrl) {
		$$.flow.describe("flows.copyUrl").processUrl(pin, sourceUrl, destUrl);
		$$.flow.describe("flows.deleteUrl").processUrl(pin, sourceUrl);
	}
});