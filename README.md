# fantasm-compoundbot

Works as an autocompounder for the [a fantasm.finance](https://fantasm.finance) smart contract. 
Via the Chron schedule the worker will withdraw all claimable rewards and lock rewards FXM back into the protocol.

## Getting started

Pull and set .env variables

MNEMONIC - The Mnemonic phrase of your wallet.  
NETWORK_WEBSOCKET_URL - The websocket url of the Fantom network. (Chainlink and Quicknode provide access to these.).   
RECIPIENT - The public address of your wallet.   

Run the server and profit! 💸
