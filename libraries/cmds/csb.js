$$.requireLibrary("flows");

doSetPin = function () {
	$$.flow.create("flows.setPin").start();
};

doAddCSB = function (aliasCSB) {
	$$.flow.create("flows.createCsb").start(aliasCSB);
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

doResetPin = function(){
	$$.flow.create("flows.resetPin").start();
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

doAddFile = function(csbUrl, filePath){
	$$.flow.create("flows.addFile").start(csbUrl, filePath);
};

doAddFolder = function(csbUrl, folderPath){
	$$.flow.create("flows.addFile").start(csbUrl, folderPath);
};

doExtract = function(url){
	$$.flow.create("flows.extract").start(url);
};

doListCsbs = function (aliasCsb) {
	$$.flow.create("flows.listCsbs").start(aliasCsb);
};

doMoveCsb = function (aliasCsb, aliasCsbSource, aliasCsbDest) {
	$$.flow.create("flows.moveCsb").start(aliasCsb, aliasCsbSource, aliasCsbDest);
};

doCopyUrl = function (sourceUrl, destUrl) {
	$$.flow.create("flows.copyUrl").start(sourceUrl, destUrl);
};

doDeleteCsb = function (aliasCsb) {
	$$.flow.create("flows.deleteCsb").start(aliasCsb);
};

doDeleteUrl = function (url) {
	$$.flow.create("flows.deleteUrl").start(url);
};


addCommand("set", "pin", doSetPin,  "\t\t\t\t\t |change the pin"); //seteaza la csb-ul master
addCommand("create", "csb", doAddCSB, "<aliasCsb> \t\t\t\t |create a new CSB having the alias <aliasCsb>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("print", "csb", doPrintCsb, "<aliasCsb>\t\t\t\t |print the CSB having the alias <aliasCsb>");
addCommand("set", "key", doSetKey, "<aliasCsb> <recordType> <key> <field>   |set the key " ); //seteaza o cheie intr-un csb
addCommand("get", "key", doGetKey, "<aliasCsb> <recordType> <key> <field>   |get the key " ); //citeste o cheie intr-un csb
addCommand("add", "backup", doAddBackup,"<url>\t\t\t\t |save all csbs at address <url>");
addCommand("restore", "csb", doRestore, "<aliasCsb>\t\t\t\t |restore the csb <aliasCsb> from one of the addresses stored\n\t\t\t\t\t\t\t  in backup\n");
addCommand("reset", "pin", doResetPin, "\t\t\t\t\t |enter the seed in order to set the pin to a new value");
addCommand("set", "url", doSetUrl, "<url> \t\t\t\t\t |set/update the record/field pointed by the provided <url>");
addCommand("get", "url", doGetUrl, "<url> \t\t\t\t\t |print the record/field indicated by te provided <url>");
addCommand("add", "file", doAddFile, "<csbUrl> <filePath> \t\t\t |add a file to the csb pointed by <csbUrl>");
addCommand("add", "folder", doAddFile, "<csbUrl> <folderPath> \t\t |add a folder to the csb pointed by <csbUrl>");
addCommand("extract", null, doExtract, "<csbUrl> <alias> \t\t\t |decrypt file/folder/csb having the alias <alias>, contained\n\t\t\t\t\t\t\t   by the csb pointed to by <csbUrl>\n");
addCommand("list", "csbs", doListCsbs, "<aliasCsb> \t\t\t\t |show all child csbs in the csb <aliasCsb>; if <aliasCsb> \n\t\t\t\t\t\t\t  is not provided, the command will print all the csbs \n\t\t\t\t\t\t\t  in the current folder\n");
addCommand("move", "csb", doMoveCsb, "<aliasCsb> <srcAlias> <destAlias> \t |move the csb <aliasCsb> from <srcAlias> to <destAlias>");
addCommand("copy", "url", doCopyUrl, "<srcUrl> <destUrl> \t |move the csb <aliasCsb> from <srcAlias> to <destAlias>");
addCommand("delete", "url", doDeleteUrl, "<url>");
// addCommand("delete", "csb", doDeleteCsb, "<aliasCsb>");
//