const utils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const crypto = require('pskcrypto');

$$.swarm.describe("createBlockchainCSB", {
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

	createMasterCsb: function(pin) {
		pin = pin || utils.defaultPin;
		$$.ensureFolderExists(utils.Paths.auxFolder, (err) => {
			if(err){
				this.swarm("interaction", "handleError", err, "Failed to create .privateSky folder");
				return;
			}
			const seed = Seed.generateCompactForm(Seed.create(utils.defaultBackup));
			const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
			RootCSB.createRootCSB(process.cwd(), null, null, dseed, null,(err, rootCSB) => {
				if(err){
					this.swarm("interaction", "handleError", err, "Failed to create rootCSB.");
					return;
				}
				this.rootCSB = rootCSB;
				this.swarm("interaction", "printSensitiveInfo", seed, utils.defaultPin);

				crypto.saveData(dseed, pin, utils.Paths.Dseed,  (err) => {
					if (err) {
						this.swarm("interaction", "handleError", err, "Failed to save dseed");
						return;
					}

					this.rootCSB.saveMasterRawCSB( (err) => {
						if (err) {
							this.swarm("interaction", "handleError", err, "Failed to save masterCSB");
							return;
						}
						this.swarm("interaction", "printInfo", "Master csb has been created");
						this.createCsb();
					});
				});
			});
		});
	},

	validatePin: function (pin, noTries) {
		RootCSB.createRootCSB(process.cwd(), null, null, null, pin, (err, rootCSB) =>{
			if(err){
				this.swarm("interaction", "readPin", noTries-1);
			}else{
				this.rootCSB = rootCSB;
				this.createCsb();
			}
		});
	},

	createCsb: function () {
		const rawCSB = new RawCSB();
		this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, (err) => {
			if(err){
				this.swarm("interaction", "handleError", err, "Failed to save CSB at path " + this.CSBPath);
				return;
			}
			this.swarm("interaction", "printInfo", "Successfully saved CSB at path " + this.CSBPath);
		});
	}
});
