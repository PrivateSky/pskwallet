
function dummy(){
    console.log("Executing dummy command ", arguments);
}


addCommand("set", "pin", dummy, "<newPin> <oldPin>"); //seteaza la csb-ul master
addCommand("create", "csb", dummy, "<csbAlias>"); //creaza un nou CSB si il adaugi in csb-ul master
addCommand("key", "set", dummy, "<keyName> <value>"); //seteaza o cheie intr-un csb
addCommand("key", "get", dummy, "<keyName> "); //citeste o cheie intr-un csb

