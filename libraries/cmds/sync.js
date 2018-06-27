
function doSync(){
    //verifici daca ai csb in subfolderul .privateSky
    //daca nu, creaza un csb in subfolderul .privateSky
    //incarca agentul curent si domeniul curent din fisierul .pskwallet din subfolderul .privateSky
    //verifici lista de remote endpoints si preia mesaje de la ele
    console.log("pskwallet sync:");
}



addCommand("sync", null, doSync, "\t\t\t\t\t\t |synchronise the current wallet with all the remote endpoints");

