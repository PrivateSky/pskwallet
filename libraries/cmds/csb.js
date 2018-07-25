$$.requireLibrary("flows");

doSetPin = function (newPin) {
	$$.flow.create("flows.setPin").start(newPin);
};

doAddCSB = function (aliasCSB) {
	$$.flow.create("flows.addCsb").start(aliasCSB);
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
addCommand("set", "pin", doSetPin, "<newPin>  \t\t\t |set the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<csbAlias> \t\t\t |create new CSB"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("key", "set", doKeySet, "<csbAlias> <recordType>   \t\t\t |set the key <keyName> of type <recordTYpe> of the <csbAlias>. If <keyName> is not specified, a <recordTYpe> record will be inserted " ); //seteaza o cheie intr-un csb
addCommand("key", "get", doKeyGet, "<csbAlias> <recordType> <keyName>  \t\t\t |get the key <keyName> of type <recordTYpe> of the <csbAlias>. If <keyName> is not specified, a <recordTYpe> record will be returned "); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>");
addCommand("reset", "pin", doResetPin, "<seed>");
addCommand("restore", "csb", doRestore);
addCommand("set", "url", doSetUrl, "<url>");

// doAddCSB("newCsb");
// doAddCSB("nouCsb");
// doSetPin("123");
// doKeySet("newCsb", "CreditCard");
// doKeyGet("newCsb", "CreditCard");
// doAddBackup("'http://localhost:8080");