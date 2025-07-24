// require("@nomiclabs/hardhat-ethers");
// require('dotenv').config();

// // defining accounts to reuse.
// const accounts = process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [];

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task("hello", "Prints Hello World", () => console.log("Hello World!"));

// task("accounts", "Prints the list of accounts with balances", async () => {
//   const accounts = await ethers.getSigners();
//   const provider = await ethers.provider;

//   for (const account of accounts) {
//     const balance = await provider.getBalance(account.address);
//     console.log(`${account.address} - ${ethers.utils.formatEther(balance)} ETH`);
//   }
// });

// task("deploy", "Deploys Contract", async () => {
//   const contractFactory = await ethers.getContractFactory("KeyManager");
//   const contract = await contractFactory.deploy();
//   await contract.deployed();
//   console.log("contract deployed at:", contract.address);
// });

// task("balance", "Prints an account's balance")
//   .addParam("account", "The account's address")
//   .setAction(async ({ account }) => {
//     const provider = await ethers.provider;
//     const balance = await provider.getBalance(account);
//     console.log(hre.ethers.utils.formatEther(balance), "ETH");
//   });


// module.exports = {
//   defaultNetwork: "local",
//   networks: {
//     hardhat: {
//       chainId: 1337
//     },
//     local: {
//       url: "http://127.0.0.1:8545",
//     },
//     main: {
//       url: process.env.ETHEREUM_MAINNET_RPC_URL,
//       accounts: accounts
//     },
//     goerli: {
//       url: process.env.GOERLI_RPC_URL,
//       accounts // private keys
//     },
//     polygonTest: {
//       url: process.env.ETHEREUM_SEPOLIA_RPC_URL,
//       accounts
//     },
//     polygonMain: {
//       url: process.env.POLYGON_MAINNET_RPC_URL,
//       accounts
//     }
//   },
//   solidity: {
//     version: "0.8.16",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200
//       }
//     }
//   },
//   paths: {
//     sources: "./contracts",
//     tests: "./test",
//     cache: "./cache",
//     artifacts: "./artifacts"
//   },
//   mocha: {
//     timeout: 20000
//   }
// };

require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

// defining accounts to reuse.
const accounts = process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [];

task("hello", "Prints Hello World", () => console.log("Hello World!"));

task("accounts", "Prints the list of accounts with balances", async () => {
  const accounts = await ethers.getSigners();
  const provider = await ethers.provider;

  for (const account of accounts) {
    const balance = await provider.getBalance(account.address);
    console.log(`${account.address} - ${ethers.utils.formatEther(balance)} ETH`);
  }
});

task("deploy", "Deploys Contract", async () => {
  const contractFactory = await ethers.getContractFactory("KeyManager");
  const contract = await contractFactory.deploy();
  await contract.deployed();
  console.log("contract deployed at:", contract.address);
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async ({ account }) => {
    const provider = await ethers.provider;
    const balance = await provider.getBalance(account);
    console.log(hre.ethers.utils.formatEther(balance), "ETH");
  });

module.exports = {
  defaultNetwork: "local",
  networks: {
    hardhat: {
      chainId: 31337
    },
    local: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/ef01014d6bf84e7c93586cd070d990af",
      chainId: 11155111,
      accounts,
      gasPrice: 25000000000, // 25 Gwei
      maxPriorityFeePerGas: 25000000000 // 25 Gwei
    },
       amoy1: {
      url: "https://polygon-amoy.gateway.tenderly.co",
      accounts,
      chainId: 80002,
      timeout: 60000,
      gasPrice: 30000000000, // 30 gwei
    },
      bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts,
      chainId: 97,
      timeout: 60000,
      gasPrice: 30000000000,
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
};
