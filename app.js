// @author: axelphunter
// https://github.com/axelphunter

require('dotenv').config();
const ethers = require('ethers');
const cron = require('node-cron');
const express = require('express');
const app = express();

const genericErc20Abi = require('./utils/genericErc20Abi.json')

const addresses = {
  FXM: '0x132b56763C0e73F95BeCA9C452BadF89802ba05e',
  contract: '0xC4510604504Fd50f64499fF6186AEf1F740dE38B',
  recipient: process.env.RECIPIENT // User of wallet address
}

// Provide Chainstack or Quicknode websocket url.
const provider = new ethers.providers.WebSocketProvider(process.env.NETWORK_WEBSOCKET_URL);
// Add Mnemonic to .envs (DO NOT HARD CODE)
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
const account = wallet.connect(provider);

// Fantasm contract methods
const contract = new ethers.Contract(
  addresses.contract,
  [
    'function getReward() public',
    'function stake(uint256 amount, bool lock) external'
  ],
  account
);

// FXM generic ERC 20 abi.
const fxm = new ethers.Contract(
  addresses.FXM,
  genericErc20Abi,
  account
)

app.listen(process.env.PORT || 4000, function () {
  console.log('Server started');
  cron.schedule('0 0 */1 * * *', async () => {
    try {
      // Withdraw all available rewards.
      await contract.getReward()
      // Query available FXM balance.
      const balance = await fxm.balanceOf(addresses.recipient);
      // Stake available FXM balance.
      await contract.stake(balance, true);
      console.log(`Staked ${balance.toString()}`)
    } catch (e) {
      console.log(e)
    }
  });
});

