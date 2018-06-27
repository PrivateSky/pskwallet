PrivateSky wallet offers command line interface for interacting with PrivateSky domains


Command Line| Description| Semantic/Motivation 
----------------------------------------- | ---------------------------------------- | -------------------------------------------- 
pskwallet listen remoteEndPoint | initialise a wallet (CSB) in the current folder and  creates a local agent for the current wallet| listen on the remoteEndPoint, prints in console an url for the topic on the remoteEndPoint. By default listen on localhost/localWalletRandomUid where RandomUid is generated for each folder where pskwallet is executed
pskwallet sync | get and execute the swarms sent to the current agent  | get and execute the swarms sent to the current agent
pskwallet create domainName  remoteEndPoint | creates a domain for development in the remoteEndPoint | creates a  CSB in the current folder containing the private key for the administrator (sort of super user) agent of the domain. Listen as admin to the remoteEndPoint
pskwallet add agent agentName | adds an agent | create an agent in current domain
pskwallet del agent agentName| remove an agent | usefull for removing the super user (admin agent) when the development is done
pskwallet transfer agent walletAgent| transfer control of the local agent to a remote agent (eg a wallet agent of another user or company) | call a transfer swarm and remove the privateKey from the local CSB

pskwallet use agent agentName | acts as the specified agent | send comamnds and listen as the specified agent
pskwallet use domain domainName | set domainName as current domain | set domainName as current domain
pskwallet add module localFolder | add a module  | used during development or at updates to add a module
pskwallet add library localFolder | add a libray  | used during development or at updates to add a library
pskwallet export key agentname| exports the private key of the agent  | print in console
pskwallet publish domain remoteEndPoint | creates an CSB with the domain constitution, publish the CSB, starts a domain remote and update the keys in the remote PDS  | starts a production  domain on a remoteEndPoint
pskwallet add parent domainName  | add domainName as parent to the current domain | add parrent
pskwallet set shares howMany  | set the number of shares | set the amount of shares in the domain. Implicit 100.
pskwallet give shares howMany toAgent   | give voting rights to another agent | give shares
pskwallet delegate howMany votingAgent | delegate the voting rights to another agent | delegate the voting power to another agent
pskwallet undelegate howMany votingAgent | delegate the voting rights to another agent | delegate the voting power to another agent



Swarms available to the pskwallet:

Swarm | Description
------------------------ | ------------------------------------------------------
core/transfer            | give and receive control of a remote agent (receive the private key), generate a new privatekey and update in domain 
core/initDomain          | initialise a domain
core/agents              | manage agents
core/parents             | manage parents
core/updateKey           | updates a key in a domain
core/shares              | manage the shares

