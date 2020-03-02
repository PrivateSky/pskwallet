const pskConsole = require('swarmutils').createPskConsole();
const pathModule = "path";
const path = require(pathModule);
process.env.PSK_ROOT_INSTALATION_FOLDER = path.resolve("." + __dirname + "/../..");
require("./cmds");
pskConsole.runCommand();
