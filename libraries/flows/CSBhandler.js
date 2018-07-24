var path = require("path");
require(path.resolve(__dirname + "/../../../../engine/core"));
const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = $$.requireModule("pskcrypto");
$$.flow.describe("CSBhandler", {
	load: function (pathMaster) {
		utils.createMasterCsb(pipathMaster);
	},
	setUrl: function (seed, seedTargetCsb, recordType, keyName, field, value) {

	},
	getUrl: function (seed, seedTargetCsb, recordType, keyName, field,) {

	}
});