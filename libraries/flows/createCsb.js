const flowsUtils = require('../../utils/flowsUtils');
const Seed = require('../../utils/Seed');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");


$$.swarm.describe("createCsb", {
    start: function (CSBPath, localFolder = process.cwd()) {
        console.log("start");
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status)=>{
            if(err){
                this.swarm("interaction", "createPin", flowsUtils.defaultPin);
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
        if (typeof backups ==='undefined' || backups.length === 0) {
            backups = [flowsUtils.defaultBackup];
        }
        this.createMasterCSB(backups);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "createCSB", pin, noTries);
    },

    loadBackups: function (pin) {
        this.pin = pin;
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(this.pin, (err, dseedBackups) => {
            if(err){
                this.createMasterCSB();
            }else{
                this.createMasterCSB(dseedBackups.backups);
            }
        });
    },

    createMasterCSB: function (backups) {
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

        if (this.pin) {
            const nextPhase = (this.CSBPath === '' || typeof this.CSBPath === 'undefined') ? 'saveRawCSB' : 'createCSB';
            this.dseedCage.saveDseedBackups(this.pin, this.dseed, backups, validator.reportOrContinue(this, nextPhase, "Failed to save dseed "));
        } else {
            this.createCSB();
        }
    },

    createCSB: function (pin) {
        this.pin = pin;
        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset("global.CSBMeta", "meta");
        meta.init();
        meta.setIsMaster(false);
        rawCSB.saveAsset(meta);
        this.saveRawCSB(rawCSB);
    },

    saveRawCSB: function (rawCSB) {
        this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccess", "Failed to save raw CSB"));

    },


    printSuccess: function () {
        let message = "Successfully saved CSB at path " + this.CSBPath;
        if (!this.CSBPath || this.CSBPath === '') {
            message = 'Successfully saved CSB root';
        }
        this.swarm("interaction", "printInfo", message);
        this.swarm('interaction', '__return__');
    }
});
