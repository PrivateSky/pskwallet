var path = require("path");

const utils = require(path.resolve(__dirname + "/../utils/utils"));
const crypto = require("pskcrypto");
$$.flow.describe("CSBhandler", {
	load: function (pathMaster) {
		utils.createMasterCsb(pipathMaster);
	},
	setUrl: function (seed, seedTargetCsb, recordType, keyName, field, value) {

	},
	getUrl: function (seed, seedTargetCsb, recordType, keyName, field,) {

	}
});