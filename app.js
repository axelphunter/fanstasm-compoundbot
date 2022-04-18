// @author: axelphunter
// https://github.com/axelphunter

require('dotenv').config();
const ethers = require('ethers');
const cron = require('node-cron');
const express = require('express');
const app = express();

const genericErc20Abi = require('./utils/genericErc20Abi.json')

const addresses = {
  // Tokens
  FXM: '0x132b56763C0e73F95BeCA9C452BadF89802ba05e',
  // Contracts
  fantasmContract: '0xC4510604504Fd50f64499fF6186AEf1F740dE38B',
  // User wallet address
  recipient: process.env.RECIPIENT
}

// Provide Chainstack or Quicknode websocket url.
const provider = new ethers.providers.WebSocketProvider(process.env.NETWORK_WEBSOCKET_URL);
// Add Mnemonic to .envs (DO NOT HARD CODE)
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
const account = wallet.connect(provider);

// Fantasm contract methods
const fantasmContract = new ethers.Contract(
  addresses.fantasmContract,
  [
    'function getReward() public',
    'function stake(uint256 amount, bool lock) external',
    'function totalBalance(address user) external view returns (uint256 amount)'
  ],
  account
);

// Generic ERC 20 abi for tokens
const FXM = new ethers.Contract(
  addresses.FXM,
  genericErc20Abi,
  account
)

app.listen(process.env.PORT || 4000, function () {
  console.log("Let's gooo!");

  const run = async () => {
    try {
      console.log('Claiming rewards...')
      // Withdraw all available rewards.
      const a = await fantasmContract.getReward()
      await a.wait()
      // Query available FXM balance.
      let balance = await FXM.balanceOf(addresses.recipient);
      // Stake available FXM balance.
      const b = await fantasmContract.stake(balance, true, { gasLimit: 300000 });
      await b.wait()
      // Get total locked 
      let totalLocked = await fantasmContract.totalBalance(addresses.recipient)
      totalLocked = parseFloat(ethers.utils.formatEther(totalLocked)).toFixed(3)
      balance = parseFloat(ethers.utils.formatEther(balance)).toFixed(3)

      console.log(`
      ==================\n
      Reward claimed: ${balance} FXM\n
      Total locked: ${totalLocked} FXM\n
      ==================\n`)
    } catch (e) {
      console.log(e)
    }
  };

  // Run worker every hour
  cron.schedule('0 0 */1 * * *', async () => {
    run()
  })
});

