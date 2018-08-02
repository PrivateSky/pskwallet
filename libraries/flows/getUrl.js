var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("getUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		utils.requirePin(url, null, this.processUrl);
	},
	processUrl: function (pin, url) {
		var args = url.split("/");
		args.unshift(pin);
		$$.flow.create("flows.getKey").getKey(...args);
	}
});