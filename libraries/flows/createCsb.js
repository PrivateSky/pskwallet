const flowsUtils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const localFolder = process.cwd();

$$.swarm.describe("createCsb", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		this.dseedCage = new DseedCage(localFolder);
		this.dseedCage.loadDseed(flowsUtils.defaultPin, (err, dseed) => {
			if (err) {
				this.swarm("interaction", "createPin", flowsUtils.defaultPin);
			} else {
				this.swarm("interaction", "readPin", flowsUtils.noTries);
			}
		});
	},
	withDseed: function(CSBPath, dseed) {
		this.CSBPath = CSBPath;
		this.rootCSB = RootCSB.loadWithDseed(localFolder, dseed, validator.reportOrContinue(this, 'createCSB', 'Failed to load master with provided dseed'));
	},
	withoutPin: function(CSBPath) {
		this.CSBPath = CSBPath;
		this.createMasterCSB();
	},
	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, "createCSB", pin, noTries);
	},

	createMasterCSB: function (pin) {
		const seed = Seed.generateCompactForm(Seed.create(flowsUtils.defaultBackup));
		this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.swarm("interaction", "printSensitiveInfo", seed, flowsUtils.defaultPin);
		this.rootCSB = RootCSB.createNew(localFolder, this.dseed);
		if(pin) {
			this.dseedCage.saveDseed(pin, this.dseed, validator.reportOrContinue(this, "createCSB", "Failed to save dseed "));
		}else{
			this.createCSB();
		}
	},
	createCSB: function () {
		const rawCSB = new RawCSB();
		this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save raw CSB"));
	},
	printSuccessMsg: function () {
		let message = "Successfully saved CSB at path " + this.CSBPath;
		if(!this.CSBPath || this.CSBPath === '') {
			message = 'Successfully saved CSB root';
		}
		this.swarm("interaction", "printInfo", message);
	}
});
