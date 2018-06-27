
function dummy(){
    console.log("Executing dummy command ", arguments);
}


addCommand("set", "shares", dummy, "<howMany> \t\t\t\t |set the ammount of shares in current domain");
addCommand("give", "shares", dummy, "<howMany>  <agentName> \t\t |give an ammount of shares to another agent");
addCommand("delegate", null, dummy, "<howMany>  <agentName> \t\t |delegate an ammount of voting power to another agent");
addCommand("undelegate", null, dummy, "<howMany>  <agentName> \t\t |remove an ammount of voting power from another agent");

