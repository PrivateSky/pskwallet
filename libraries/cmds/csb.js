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
	$$.flow.create("flows.setKey").start(aliasCsb, recordType, key, field);
};

doGetKey = function (aliasCsb, recordType, key, field) {
	$$.flow.create("flows.getKey").start(aliasCsb, recordType, key, field);
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

doAddChild = function(parentUrl, childUrl){
	$$.flow.create("flows.addChild").start(parentUrl, childUrl);
};
doExtractChild = function(parentUrl, childAlias){
	$$.flow.create("flows.extractChild").start(parentUrl, childAlias);
};

doListCsbs = function (aliasCsb) {
	$$.flow.create("flows.listCsbs").start(aliasCsb);
};

doMoveCsb = function (aliasCsb, aliasCsbSource, aliasCsbDest) {
	$$.flow.create("flows.moveCsb").start(aliasCsb, aliasCsbSource, aliasCsbDest);
};

doDeleteCsb = function (aliasCsb) {
	$$.flow.create("flows.deleteCsb").start(aliasCsb);
};


addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<csbAlias> \t\t\t\t |create new CSB"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("print", "csb", doPrintCsb, "<aliasCsb>\t |print the csb");
addCommand("set", "key", doSetKey, "<csbAlias> <recordType> <key> <field>   |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<csbAlias> <recordType> <key> <field>   |get the key " ); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>\t\t\t\t |save all csbs at address <url>");
addCommand("restore", "csb", doRestore, "<aliasCsb>\t\t\t\t |restore the csb <aliasCsb> from one of the addresses stored\n\t\t\t\t\t\t\t  in backup\n");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("set", "url", doSetUrl, "<url> \t\t\t\t\t |set/update the record/field pointed by the provided <url>");
addCommand("get", "url", doGetUrl, "<url> \t\t\t\t\t |print the record/field indicated by te provided <url>");
addCommand("add", "child", doAddChild, "<parentUrl> <childUrl> \t\t |add file/folder to the csb pointed by <parentUrl>");
addCommand("extract", "child", doExtractChild, "<parentUrl> <childAlias> \t |decrypt file/folder having the alias <childAlias>, contained\n\t\t\t\t\t\t\t   by the csb pointed to by <parentUrl>\n");
addCommand("list", "csbs", doListCsbs, "<aliasCsb> \t\t\t\t |show all child csbs in the csb <aliasCsb>; if <aliasCsb> \n\t\t\t\t\t\t\t  is not provided, the command will print all the csbs \n\t\t\t\t\t\t\t  in the current folder\n");
addCommand("move", "csb", doMoveCsb, "<csbAlias> <srcAlias> <destAlias> \t |move the csb <csbAlias> from <srcAlias> to <destAlias>");
// addCommand("delete", "csb", doDeleteCsb, "<aliasCsb>");
//