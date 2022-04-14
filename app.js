require('dotenv').config()
const ethers = require('ethers');
var cron = require('node-cron');


const genericErc20Abi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "type": "function"
  }
]

const addresses = {
  FXM: '0x132b56763C0e73F95BeCA9C452BadF89802ba05e',
  contract: '0xC4510604504Fd50f64499fF6186AEf1F740dE38B',
  recipient: process.env.RECIPIENT
}

const provider = new ethers.providers.WebSocketProvider(process.env.NETWORK_WEBSOCKET_URL);
const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
const account = wallet.connect(provider);

const contract = new ethers.Contract(
  addresses.contract,
  [
    'function getReward() public',
    'function stake(uint256 amount, bool lock) external'
  ],
  account
);
const fxm = new ethers.Contract(
  addresses.FXM,
  genericErc20Abi,
  account
)

app.listen(process.env.PORT || 4000, function () {
  console.log('Server starting');
  cron.schedule('0 0 */2 * * *', async () => {
    try {
      const balance = await fxm.balanceOf(addresses.recipient);
      await contract.getReward()
      await contract.stake(balance, true);
      console.log(`Staked ${balance.toString()}`)
    } catch (e) {
      console.log(e)
    }
  });
});

