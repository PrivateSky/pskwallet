var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");

$$.flow.describe("setUrl", {
	start: function (url) {// url = alias1/alias2/.../aliasn/recordType/key/field
		utils.requirePin(url, null, this.processUrl);
	},
	processUrl: function (pin, url) {
		var masterCsb = utils.readMasterCsb(pin);
		var args = utils.traverseUrl(pin, masterCsb.data, url);
		args.shift();
		args.unshift(pin);
		$$.flow.create("flows.setRecord").readStructure(...args);
	}

});