require('../../psknode/bundles/pskruntime');
require('../../psknode/bundles/consoleTools');
const pskConsole = require('swarmutils').createPskConsole();
$$.loadLibrary("cmds",require('./libraries/cmds/index'));
$$.loadLibrary("pskwallet",require("./libraries/flows/index"));
pskConsole.runCommand();
