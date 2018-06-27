
function dummy(){
    console.log("Executing dummy command ", arguments);
}


addCommand("add", "agent", dummy, "<agentName> \t\t\t\t |add a new agent in the current domain");
addCommand("del", "agent", dummy, "<agentName> \t\t\t\t |remove the agent");
addCommand("transfer", "agent", dummy, "<agentName> <remoteWalletUid> \t |transfer the private key of an agent to another wallet");
addCommand("allow", "agent", dummy, "<agentName> <remoteWalletUid> \t |transfer a temporary private key of an agent to another wallet");
