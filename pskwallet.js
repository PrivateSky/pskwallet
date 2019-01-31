require('../../builds/devel/pskruntime');
require('../../builds/devel/consoleTools');
const pskConsole = require('swarmutils').createPskConsole();
$$.loadLibrary("cmds",require('./libraries/cmds/index'));
$$.loadLibrary("pskwallet",require("./libraries/flows/index"));
pskConsole.runCommand();
