const flowsUtils = require("./../../utils/flowsUtils");
const validator = require("../../utils/validator");
const fs = require("fs");
const RootCSB = require("../RootCSB");
const Seed = require("../../utils/Seed");

$$.swarm.describe("listCSBs", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.swarm("interaction", "noMasterCSBExists");
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    withSeed: function (seed, CSBPath = '', localFolder = process.cwd()) {
        const dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
        this.withDseed(dseed, CSBPath, localFolder);
    },

    withDseed: function (dseed, CSBPath = '', localFolder = process.cwd()) {
        this.dseed = dseed;
        this.CSBPath = CSBPath;
        this.localFolder = localFolder;
        this.createRootCSB();
    },

    createRootCSB: function () {
        RootCSB.loadWithDseed(this.localFolder, this.dseed, validator.reportOrContinue(this, "loadRawCSB", "Failed to create RootCSB."));
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadRawCSB', pin, noTries);
    },

    loadRawCSB: function (rootCSB) {
        if(typeof this.rootCSB === "undefined" && rootCSB){
            this.rootCSB = rootCSB;
        }
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
