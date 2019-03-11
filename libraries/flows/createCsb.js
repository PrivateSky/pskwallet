const flowsUtils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");

$$.swarm.describe("createCsb", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath;
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(flowsUtils.defaultPin, (err, dseed, backups) => {
            if (!dseed) {
                this.swarm("interaction", "createPin", flowsUtils.defaultPin, backups);
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },
    withDseed: function (CSBPath, dseed) {
        this.CSBPath = CSBPath;
        this.rootCSB = RootCSB.loadWithDseed(this.localFolder, dseed, validator.reportOrContinue(this, 'createCSB', 'Failed to load master with provided dseed'));
    },

    withoutPin: function (CSBPath, backups, localFolder = process.cwd(), isMaster = false) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath;
        this.isMaster = isMaster;
        if (backups.length === 0) {
            backups = flowsUtils.defaultBackup;
        }
        this.createMasterCSB(undefined, backups);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "createCSB", pin, noTries);
    },

    createMasterCSB: function (pin, backups) {
        const seed = Seed.generateCompactForm(Seed.create(backups || flowsUtils.defaultBackup));
        this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
        this.swarm("interaction", "printSensitiveInfo", seed, flowsUtils.defaultPin);
        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset('global.CSBMeta', 'meta');
        meta.init();
        meta.setIsMaster(true);
        if (typeof this.isMaster !== 'undefined') {
            meta.setIsMaster(this.isMaster);
        }
        rawCSB.saveAsset(meta);
        this.rootCSB = RootCSB.createNew(this.localFolder, this.dseed, rawCSB);

        if (pin) {
            this.dseedCage.saveDseedBackups(pin, this.dseed, backups, validator.reportOrContinue(this, "createCSB", "Failed to save dseed "));
        } else {
            this.createCSB();
        }
    },

    createCSB: function () {
        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset("global.CSBMeta", "meta");
        meta.init();
        meta.setIsMaster(false);
        rawCSB.saveAsset(meta);
        this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccessMsg", "Failed to save raw CSB"));
    },

    printSuccessMsg: function () {
        let message = "Successfully saved CSB at path " + this.CSBPath;
        if (!this.CSBPath || this.CSBPath === '') {
            message = 'Successfully saved CSB root';
        }
        this.swarm("interaction", "printInfo", message);
        this.swarm('interaction', '__return__');
    }
});
