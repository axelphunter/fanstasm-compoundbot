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
    'function stake(uint256 amount, bool lock) external',
    'function totalBalance(address user) external view returns (uint256 amount)'
  ],
  account
);

// FXM generic ERC 20 abi.
const fxm = new ethers.Contract(
  addresses.FXM,
  genericErc20Abi,
  account
)

const expectedBlockTime = 3000; // Three seconds

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

app.listen(process.env.PORT || 4000, function () {
  console.log("Let's gooo!");

  const run = async () => {
    try {
      // Withdraw all available rewards.
      await contract.getReward()
      await sleep(expectedBlockTime)
      // Query available FXM balance.
      let balance = await fxm.balanceOf(addresses.recipient);
      // Stake available FXM balance.
      await contract.stake(balance, true);
      await sleep(expectedBlockTime)
      // Get total locked 
      let totalLocked = await contract.totalBalance(addresses.recipient)
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

  run()

  cron.schedule('0 0 */1 * * *', async () => {
    run()
  })
});

