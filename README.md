PrivateSky wallet offers comman line interface for interacting with privateSky


Command | description| Semantic/Motivation 
--------------------------------------------- | ------------ | ------------ 
pskwallet listen remoteEndPoint | initialise a wallet in current folder and  create an local agent for the current wallet| listen on the remoteEndPoint, prints in console an url for the topic on the remoteEndPoint. By default listen on localhost/localWalletrandom
pskwallet init domainName  remoteEndPoint | creates a domain on the remoteEndPoint | creates a  CSB in the current folder containing the private key for the administrator (sort of super user) agent of the domain
pskwallet add agent agentname | adds an agent | create the privatekey in the current user
pskwallet remove agent | remove an agent | usefull for removing the super user (admin agent) when the development is done
pskwallet add module localFolder | add a module  | used during development or at updates to add a module
pskwallet add library localFolder | add a libray  | used during development or at updates to add a library
pskwallet transfer agent walletAgent| transfer control of the local agent to a remote agent (eg an wallet agent) | 


pskwallet extract key agentname|   | 
