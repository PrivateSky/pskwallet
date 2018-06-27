
function dummy(){
    console.log("Executing dummy command ", arguments);
}


addCommand("connect", null, dummy, "<remoteEndPoint>   \t\t\t |connect to a remote privateSky service");
addCommand("create", "domain", dummy, "<domainName> <remoteEndPoint> \t |create a domain on a remote service");
addCommand("publish", "domain", dummy, "<domainName> <remoteEndPoint> \t |publish a domain on a remote service");
addCommand("list", "services", dummy, "\t\t\t\t\t |list remote end points");
addCommand("list", "domains", dummy, "\t\t\t\t\t |list all domains");
