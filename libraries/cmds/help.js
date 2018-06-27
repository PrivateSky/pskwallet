function doHelp(){
    console.log("pskwallet help:");
}



addCommand("-h", null, doHelp);
addCommand("/?", null, doHelp);
addCommand("help", null, doHelp);

