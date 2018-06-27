

var commands = {};
var commands_help = {};
require("callflow");

//global function addCommand
addCommand = function addCommand(verb, adverbe, funct, helpLine){
    var cmdId;
    if(adverbe){
        cmdId = verb + " & " +  adverbe;
        helpLine = verb + " " +  adverbe + helpLine;
    } else {
        cmdId = verb;
        helpLine = verb + helpLine;
    }
    commands[cmdId] = funct;
        commands_help[cmdId] = helpLine;
}

function doHelp(){
    for(var l in commands_help){
        console.log(commands_help[l]);
    }
}

addCommand("-h", null, doHelp);
addCommand("/?", null, doHelp);
addCommand("help", null, doHelp);


function runCommand(){
  var argv = process.argv;
  var cmdId = "help";
  console.log(argv.length);
  var cmd = null;
  argv.shift();
  argv.shift();
  if(argv.length >=1){
      cmdId = argv[1];
      cmd = commands[cmdId];
      argv.shift();
  }

  if(!cmd && argv.length >=1){
      cmdId = argv[3] + "&" + argv[4];
      cmd = commands[cmdId];
  }
  if(!cmd){
    console.log("Unkwnown command: ", cmdId);
    cmd = "use";
  } else {
      cmd(argv);
  }
}

$$.__global.__loadLibrayRoot = __dirname + "/../libraries/";

$$.requireLibrary("cmds");


runCommand();
