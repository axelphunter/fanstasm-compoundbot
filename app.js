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
  // Beefy contracts
  beefyContract: '0x8afc0f9bdc5dca9f0408df03a03520bfa98a15af',
  // Vaults
  beefyVault: '0x429590a528A86a0da0ACa9Aa7CD087BAdc790Af8', // TOMB-FTM LP vault

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

// Beefy contract methods
const beefyContract = new ethers.Contract(
  addresses.beefyContract,
  [
    'function beefInETH (address beefyVault, uint256 tokenAmountOutMin) external payable'
  ],
  account
)

// Generic ERC 20 abi for tokens
const FXM = new ethers.Contract(
  addresses.FXM,
  genericErc20Abi,
  account
)

app.listen(process.env.PORT || 4000, function () {
  console.log("Let's gooo!");
  let vaultIndex = 0

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

      // Comment this line if you do not want to stake FTM rewards into beefy pool
      // https://app.beefy.com/#/fantom/vault/tomb-tomb-wftm
      await addFTMToBeefy();
    } catch (e) {
      console.log(e)
    }
  };

  // Add rewarded FTM into TOMB/FTM beefy vault
  const addFTMToBeefy = async () => {
    try {
      console.log('Adding FTM to beefy pool')
      let balance = await account.getBalance();
      balance = ethers.utils.formatEther(balance)

      // Every 20 FXM, move into vault
      if (parseInt(balance) > 20) {
        // Make sure we keep some extra for gas
        const amountToBeefIn = ethers.utils.parseEther((parseInt(balance) - 1).toString())

        const overrides = { gasLimit: 2000000, value: amountToBeefIn }
        // Drop FTM into beefy vault
        const tx = await beefyContract.beefInETH(addresses.beefyVault, amountToBeefIn.div(2).div(100).mul(90), overrides)
        await tx.wait();
        console.log(`Topped up beefy vault: ${addresses.beefyVault}`);
      } else {
        console.log('Not enough FTM.')
      }
    } catch (e) {
      console.log(e)
    }
  }

  // Run worker every hour
  cron.schedule('0 0 */1 * * *', async () => {
    run()
  })
});

