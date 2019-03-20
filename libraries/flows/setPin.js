const validator = require("../../utils/validator");
const DseedCage = require('../../utils/DseedCage');

$$.swarm.describe("setPin", {
	start: function (localFolder = process.cwd()) {
		this.localFolder = localFolder;
		this.swarm("interaction", "readPin", 3);
	},

	validatePin: function (oldPin, noTries) {
		this.oldPin = oldPin;
		validator.validatePin(this.localFolder, this, "interactionJumper", oldPin, noTries);
	},

	interactionJumper: function(){
		this.swarm("interaction", "enterNewPin");
	},

	actualizePin: function (newPin) {
		this.dseedCage = new DseedCage(this.localFolder);
		console.log("old pin", this.oldPin);
		this.dseedCage.loadDseedBackups(this.oldPin, validator.reportOrContinue(this, "saveDseed", "Failed to load dseed.", newPin));
	},

	saveDseed: function (dseed, backups, pin) {
		console.log("Bckups", backups);
		console.log("Pin", pin);
		console.log("Dseed", dseed);
		this.dseedCage.saveDseedBackups(pin, dseed, backups, validator.reportOrContinue(this, "successState", "Failed to save dseed"));
	},

	successState: function () {
		this.swarm("interaction", "printInfo", "The pin has been successfully changed.");
	}
});