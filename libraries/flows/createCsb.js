const flowsUtils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const crypto = require('pskcrypto');
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const HashCage = require("../../utils/HashCage");
const localFolder = process.cwd();

$$.swarm.describe("createCsb", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.dseedCage = new DseedCage(localFolder);
		this.dseedCage.loadDseed(flowsUtils.defaultPin, (err, dseed) => {
			if (err) {
				this.swarm("interaction", "readPin", flowsUtils.noTries, flowsUtils.defaultPin, true);
			} else {
				this.swarm("interaction", "readPin", flowsUtils.noTries);
			}
		});
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, "createCSB", pin, noTries);
	},

	createMasterCSB: function (pin) {
		const seed = Seed.generateCompactForm(Seed.create(flowsUtils.defaultBackup));
		this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.swarm("interaction", "printSensitiveInfo", seed, flowsUtils.defaultPin);
		this.rootCSB = RootCSB.createNew(localFolder, this.dseed);
		this.dseedCage.saveDseed(pin, this.dseed, validator.reportOrContinue(this, "createCSB", "Failed to save dseed "));
	},

	createCSB: function () {
		const rawCSB = new RawCSB();
		this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save raw CSB"));
	},

	computeHash: function () {

	},

	printSuccessMsg: function () {
		this.swarm("interaction", "printInfo", "Successfully saved CSB at path " + this.CSBPath);
	}
});
