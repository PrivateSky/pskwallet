const utils = require("./../../utils/flowsUtils");
const crypto = require("pskcrypto");
const validator = require("../../utils/validator");

$$.swarm.describe("setPin", {
	start: function () {
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (oldPin, noTries) {
		this.oldPin = oldPin;
		validator.validatePin(process.cwd(), this, "interactionJumper", oldPin, noTries);
	},

	interactionJumper: function(){
		this.swarm("interaction", "enterNewPin");
	},

	actualizePin: function (newPin) {
		crypto.loadData(this.oldPin, utils.Paths.Dseed, validator.reportOrContinue(this, "saveDseed", "Failed to load dseed.", newPin));
	},

	saveDseed: function (dseed, pin) {
		crypto.saveData(dseed, pin, utils.Paths.Dseed, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save dseed"));
	},

	printSuccessMsg: function () {
		this.swarm("interaction", "printInfo", "The pin has been successfully changed. ");
	}
});