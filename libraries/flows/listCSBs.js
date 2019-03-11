const flowsUtils = require("./../../utils/flowsUtils");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const localFolder = process.cwd();

$$.swarm.describe("listCSBs", {
	start: function (CSBPath) {
		this.CSBPath = CSBPath;

        this.dseedCage = new DseedCage(localFolder);
        this.dseedCage.loadDseedBackups(flowsUtils.defaultPin, (err, dseed, backups) => {
            if (err) {
                this.swarm("interaction", "noMasterCSBExists");
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(localFolder, this, 'loadRawCSB', pin, noTries);
	},

	loadRawCSB: function () {
		this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, 'getCSBs', 'Failed to load rawCSB'));
	},

	getCSBs: function (rawCSB) {
		const csbReferences = rawCSB.getAllAssets('global.CSBReference');
		const csbsAliases = csbReferences.map(ref => ref.alias);

		const fileReferences = rawCSB.getAllAssets('global.FileReference');
		const filesAliases = fileReferences.map(ref => ref.alias);

		this.swarm("interaction", "__return__", {
			csbs: csbsAliases,
			files: filesAliases
		});
	}

});