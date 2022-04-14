# fantasm-compoundbot

Works as an autocompounder for the [fantasm.finance](https://fantasm.finance) smart contract. 
Via the Cron schedule the worker will withdraw all claimable rewards and lock rewards FXM back into the protocol.  

Cron job is currently set to run every hour.

## Getting started

Pull and set .env variables

MNEMONIC - The Mnemonic phrase of your wallet.  
NETWORK_WEBSOCKET_URL - The websocket url of the Fantom network. (Chainlink and Quicknode provide access to these.).   
RECIPIENT - The public address of your wallet.   

Run the server and profit! 💸

[🐦 Twitter](https://twitter.com/axelphunter)

Donations welcome:
0x3Bf41F77B7781C300dE956c99B552F3569664Acd
