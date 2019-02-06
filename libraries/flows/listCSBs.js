const flowsUtils = require("./../../utils/flowsUtils");
const validator = require("../../utils/validator");

const localFolder = process.cwd();

$$.swarm.describe("listCSBs", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.swarm("interaction", "readPin", flowsUtils.noTries);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, 'loadRawCSB', pin, noTries);
	},

	loadRawCSB: function () {
		this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, 'getCSBs', 'Failed to load rawCSB'));
	},

	getCSBs: function (rawCSB) {
		const csbReferences = rawCSB.getAllAssets('global.CSBReference');
		const csbAliases = csbReferences.map(ref => ref.alias);
		this.swarm("interaction", "__return__", csbAliases);
	}

});