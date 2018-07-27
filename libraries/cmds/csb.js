$$.requireLibrary("flows");

doSetPin = function () {
	$$.flow.create("flows.setPin").start();
};

doAddCSB = function (aliasCSB) {
	$$.flow.create("flows.addCsb").start(aliasCSB);
};

doPrintCsb = function (aliasCsb) {
	$$.flow.create("flows.printCsb").start(aliasCsb);
};

doKeySet = function (aliasCsb, recordType, key) {
	$$.flow.create("flows.setRecord").start(aliasCsb, recordType, key);
};

doKeyGet = function (aliasCsb, recordType, keyName) {
	$$.flow.create("flows.getRecord").start(aliasCsb, recordType, keyName);
};

doAddBackup = function (url) {
	$$.flow.create("flows.addBackup").start(url);
};

doResetPin = function(seed){
	$$.flow.create("flows.resetPin").start(seed);
};

doRestore = function () {
	$$.flow.create("flows.restore").start();
};

doSetUrl = function (url) {
	$$.flow.create("flows.setUrl").start(url);
};

doGetUrl = function (url) {
	$$.flow.create("flows.getUrl").start(url);
};

doAddChild = function(aliasParentCsb, aliasChildCsb){
	$$.flow.create("flows.addChild").start(aliasParentCsb, aliasChildCsb);
};
addCommand("set", "pin", doSetPin, "\t\t\t\t |set the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<csbAlias> \t\t\t\t |create new CSB"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("print", "csb", doPrintCsb, "<aliasCsb>\t |print the csb");
addCommand("set", "key", doKeySet, "<csbAlias> <recordType> <key>\t\t |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doKeyGet, "<csbAlias> <recordType> <key>\t\t |get the key " ); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>");
addCommand("reset", "pin", doResetPin);
addCommand("restore", "csb", doRestore);
addCommand("set", "url", doSetUrl, "<url>");
addCommand("get", "url", doGetUrl, "<url>");
addCommand("add", "child", doAddChild, "<aliasParentCsb> <aliasChildCsb>");


// doAddCSB("newCsb");
// doAddCSB("nouCsb");
// doSetPin("123");
// doKeySet("newCsb", "CreditCard");
// doKeyGet("newCsb", "CreditCard");
// doAddBackup("'http://localhost:8080");