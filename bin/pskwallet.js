

var commands = {};
require("callflow");

$$.__global.addCommand = function addCommand(verb, adverbe, funct){
    var cmdId;
    if(adverbe){
        cmdId = verb + "&" +  adverbe;
    } else {
        cmdId = verb;
    }
    commands[cmdId] = funct;
}




function runCommand(){
  var argv = process.argv;
  var cmdId = "help";
  console.log(argv.length);
  var cmd = null;
  if(argv.length >=3){
      cmdId = argv[3];
      cmd = commands[cmdId];
  }

  if(!cmd && argv.length >=4){
      cmdId = argv[3] + "&" + argv[4];
      cmd = commands[cmdId];
  }

  if(!cmd){

  } else {
      cmd();
  }
}

addCommand  = $$.__global.addCommand;

$$.requireLibrary("cmds");



runCommand();
