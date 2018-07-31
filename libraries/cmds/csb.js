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

doSetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.create("flows.setRecord").start(aliasCsb, recordType, key, field);
};

doGetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.create("flows.getRecord").start(aliasCsb, recordType, key, field);
};

doAddBackup = function (url) {
	$$.flow.create("flows.addBackup").start(url);
};

doResetPin = function(seed){
	$$.flow.create("flows.resetPin").start(seed);
};

doRestore = function (aliasCsb) {
	$$.flow.create("flows.restore").start(aliasCsb);
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
addCommand("set", "key", doSetKey, "<csbAlias> <recordType> <key> <field>\t\t |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<csbAlias> <recordType> <key> <field>\t\t |get the key " ); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>");
addCommand("reset", "pin", doResetPin);
addCommand("restore", "csb", doRestore, "<aliasCsb>");
addCommand("set", "url", doSetUrl, "<url>");
addCommand("get", "url", doGetUrl, "<url>");
addCommand("add", "child", doAddChild, "<aliasParentCsb> <aliasChildCsb>");


// doAddCSB("newCsb");
// doAddCSB("nouCsb");
// doSetPin("123");
// doKeySet("newCsb", "CreditCard");
// doKeyGet("newCsb", "CreditCard");
// doAddBackup("'http://localhost:8080");