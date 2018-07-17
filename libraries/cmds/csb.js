var path = require('path');

var flowsPath = path.resolve(__dirname+"/../flows");
console.log(path.join(flowsPath, "addCsb"))
require(path.join(flowsPath, "addCsb"));
require(path.join(flowsPath,"setKey"));
require(path.join(flowsPath,"getKey"));
require(path.join(flowsPath,"setPin"));

doSetPin = function (newPin) {
	$$.flow.create("setPin").start(newPin);
};

doAddCSB = function (aliasCSB) {
	$$.flow.create("addCsb").start(aliasCSB);
};

doKeySet = function (aliasCsb, recordType) {
	$$.flow.create("setKey").start(aliasCsb, recordType);
};

doKeyGet = function (aliasCsb, recordType) {
	$$.flow.create("getKey").start(aliasCsb, recordType);
};

doAddBackup = function (url, type) {

};

// addCommand("set", "pin", doSetPin, "<newPin>  \t\t\t |set the pin"); //seteaza la csb-ul master
// addCommand("create", "csb", doAddCSB, "<csbAlias> \t\t\t |create new CSB"); //creaza un nou CSB si il adaugi in csb-ul master
// addCommand("key", "set", doKeySet, "<csbAlias> <recordType>   \t\t\t |set the key <keyName> of type <recordTYpe> of the <csbAlias>. If <keyName> is not specified, a <recordTYpe> record will be inserted " ); //seteaza o cheie intr-un csb
// addCommand("key", "get", doKeyGet, "<csbAlias> <recordType> <keyName>  \t\t\t |get the key <keyName> of type <recordTYpe> of the <csbAlias>. If <keyName> is not specified, a <recordTYpe> record will be returned "); //citeste o cheie intr-un csb
//
// addCommand("add", "backup", doAddBackup,"<url> <type>");

// doAddCSB("newCsb");
// doAddCSB("nouCsb");
// doSetPin("123");
// doKeySet("newCsb", "CreditCard");
doKeyGet("newCsb", "CreditCard");