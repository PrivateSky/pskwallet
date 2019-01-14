const utils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const crypto = require('pskcrypto');
const validator = require("../../utils/validator");

$$.swarm.describe("createCsb", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;
		utils.masterCsbExists( (err, status) => {
			if(err){
				this.swarm("interaction", "readPin", utils.noTries, utils.defaultPin, true);
			}else{
				this.swarm("interaction", "readPin", utils.noTries);
			}
		});
	},
	validatePin: function(pin, noTries){
		validator.validatePin(this, "createCSB", pin, noTries);
	},

	createAuxFolder: function(pin) {
		pin = pin || utils.defaultPin;
		$$.ensureFolderExists(utils.Paths.auxFolder, validator.reportOrContinue(this, "createMasterCSB", "Failed to create .privateSky folder.", pin ));

	},

	createMasterCSB: function(pin){
		const seed = Seed.generateCompactForm(Seed.create(utils.defaultBackup));
		const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
		this.swarm("interaction", "printSensitiveInfo", seed, utils.defaultPin);
		RootCSB.createRootCSB(process.cwd(), null, null, dseed, null, validator.reportOrContinue(this, "saveDseed", "Failed to create root CSB.", dseed, pin));
	},

	saveDseed: function(rootCSB, dseed, pin){
		this.rootCSB = rootCSB;
		crypto.saveData(dseed, pin, utils.Paths.Dseed, validator.reportOrContinue(this, "saveMasterCSB"))
	},
	saveMasterCSB: function(){
		this.rootCSB.saveMasterRawCSB(validator.reportOrContinue(this, "createCSB", "Failed to save masterCSB"));
	},

	createCSB: function () {
		const rawCSB = new RawCSB();
		this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save raw CSB"));
	},

	printSuccessMsg: function () {
		this.swarm("interaction", "printInfo", "Successfully saved CSB at path " + this.CSBPath);
	}
});
