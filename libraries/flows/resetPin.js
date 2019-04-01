const utils = require("./../../utils/flowsUtils");
const RootCSB = require("../RootCSB");
const Seed = require("../../utils/Seed");
const DseedCage = require("../../utils/DseedCage");

$$.swarm.describe("resetPin", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readSeed", utils.noTries);
    },

    validateSeed: function (seed, noTries) {
        try{
        RootCSB.loadWithSeed(this.localFolder, seed, (err, rootCSB) => {
            if (err) {
                this.swarm("interaction", "readSeed", noTries-1);
            }else{
                this.dseed = Seed.generateCompactForm(Seed.deriveSeed(seed));
                this.swarm("interaction", "insertPin", utils.noTries);
            }
        });
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }
    },

    actualizePin: function (pin) {
        const dseedCage = new DseedCage(this.localFolder);
        dseedCage.saveDseedBackups(pin, this.dseed, undefined, (err)=>{
            if(err){
                return this.swarm("interaction", "handleError", "Failed to save dseed.");
            }

            this.swarm("interaction", "printInfo", "The pin has been changed successfully.");
        })
    }
});
