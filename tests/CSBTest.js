require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/consoleTools');
require("../../../psknode/bundles/virtualMQ");

const assert = require("double-check").assert;
const VirtualMQ = require('virtualmq');
require('psk-http-client');
const utils = require("./utils/utils");
const path = require("path");
const fs = require("fs");
const is = require("interact").createInteractionSpace();
const CSBConsensusManager = require("./utils/CSBConsensusManager");

const resourcesDir = path.resolve(__dirname, "./testResources");
const localFolder = path.join(resourcesDir, "testDir");
const fileName = "anne_hathaway.jpeg";

const PORT = 9090;
const tempFolder = path.resolve('../tmp');

const backupUrl = [`http://localhost:${PORT}`];

function handleError(err) {
    throw err;
}

console.log("Local folder:", localFolder);

const s = $$.swarm.describe("CSBTest", {
    init: function (localFolder, callback) {
        this.CSBPath = '';
        this.callback = callback;
        this.counter = 0;
        fs.mkdir(localFolder, {recursive: true}, (err) => {
            if (err) {
                throw err;
            }

            this.__cleanFolder(localFolder, (err) => {
                if (err) {
                    throw err;
                }
                this.localFolder = localFolder;

                //start virtualMq
                this.virtualMq = VirtualMQ.createVirtualMQ(PORT, tempFolder, () => {
                    // this.createCSB(this.CSBPath, backupUrl, undefined, "attachFile", this.CSBPath + "/anne", fileName);
                    this.createCSB(this.CSBPath, backupUrl, undefined, "listCSBs");
                });
            })
        });
    },

    createCSB: function (CSBPath, backups, seed, nextPhase, ...args) {
        const self = this;
        this.counter++;
        if (this.counter < 3) {
            is.startSwarm("createCsb", "withoutPin", CSBPath, backups, this.localFolder, seed, true).on({
                handleError: handleError,
                printSensitiveInfo: function (generatedSeed) {
                    assert.true(generatedSeed !== null && generatedSeed !== undefined, "Generated seed is null or undefined");
                    this.CSBConsensusManager = new CSBConsensusManager(self.localFolder, generatedSeed);
                    this.CSBConsensusManager.saveBackup();
                    self.seed = generatedSeed;
                },
                __return__: function (rootCSB) {
                    self.rootCSB = self.rootCSB || rootCSB;
                    if (nextPhase) {
                        self[nextPhase](...args);
                    }
                }
            });
        } else {
            setTimeout(()=>{
                this.__cleanFolder(this.localFolder, err => {
                    if (err) {
                        throw err;
                    }

                    this.restore();
                });
            }, 1000)
        }
    },

    attachFile: function (url, fileName) {
        const self = this;
        is.startSwarm("attachFile", "withCSBIdentifier", this.seed, url, path.join(resourcesDir, fileName), this.localFolder).on({
            handleError: handleError,

            __return__: function () {
                self.CSBPath += "/csb" + self.counter;
                self.createCSB(self.CSBPath, backupUrl, self.seed, "attachFile", self.CSBPath + "/anne", fileName);
            }
        })
    },

    restore: function (CSBPath, localSeed) {
        const self = this;
        is.startSwarm("restore", "withSeed", CSBPath, this.localFolder, this.seed, localSeed).on({
            handleError: handleError,
            printSensitiveInfo: function (seed, defaultPin) {
                assert.true(seed !== null && seed !== undefined, "Seed is null or undefined");
                assert.true(defaultPin === "12345678", "Unexpected default pin");
            },
            // readPin: readPin
            __return__: function () {
                self.virtualMq.close();
                self.callback();

            }
        });
    },

    listCSBs: function () {
        const self = this;
        is.startSwarm("listCSBs", "withCSBIdentifier", this.seed, undefined, this.localFolder).on({
            // printInfo: utils.generateMessagePrinter(),
            handleError: handleError,
            __return__: function (csbAliases) {
                self.CSBPath += "/csb" + self.counter;
                self.createCSB(self.CSBPath, backupUrl, self.seed, "listCSBs");
            },
            noMasterCSBExists: function () {
                throw new Error("Master CSB does not exist");
            }
        })
    },

    __cleanFolder: function (folderPath, callback) {
        utils.deleteRecursively(folderPath, err => {
            if (err) {
                return callback(err);
            }

            fs.mkdir(folderPath, {recursive: true}, err => {
                if (err) {
                    return callback(err);
                }

                callback();
            });
        });
    }
})();

assert.callback("Create, backup automatically, restore", (callback) => {
    s.init(localFolder, callback);
}, 2000);
