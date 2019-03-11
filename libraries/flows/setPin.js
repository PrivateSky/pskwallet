const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
const validator = require("../../utils/validator");
const DseedCage = require('../../utils/DseedCage');
const localFolder = process.cwd();

$$.swarm.describe("setPin", {
	start: function () {
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (oldPin, noTries) {
		this.oldPin = oldPin;
		validator.validatePin(localFolder, this, "interactionJumper", oldPin, noTries);
	},

	interactionJumper: function(){
		this.swarm("interaction", "enterNewPin");
	},

	actualizePin: function (newPin) {
		this.dseedCage = new DseedCage(localFolder);

		this.dseedCage.loadDseedBackups(this.oldPin, validator.reportOrContinue(this, "saveDseed", "Failed to load dseed.", newPin));
	},

	saveDseed: function (dseed, backups = [], pin) {
		this.dseedCage.saveDseedBackups(pin, dseed, backups, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save dseed"));
	},

	printSuccessMsg: function () {
		this.swarm("interaction", "printInfo", "The pin has been successfully changed. ");
	}
});