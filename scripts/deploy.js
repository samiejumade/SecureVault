const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying contract...");
  const contractFactory = await ethers.getContractFactory("KeyManager");
  const contract = await contractFactory.deploy();
  await contract.deployed();
  
  const address = contract.address;
  console.log("Contract deployed at:", address);

  // Write address to client .env file
  const envPath = path.join(__dirname, '../client/.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const regex = /^NEXT_PUBLIC_CONTRACT_ADDRESS=.*$/m;
  const replacement = `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`;
  
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, replacement);
  } else {
    envContent += `\n${replacement}`;
  }
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log("✅ Successfully updated client/.env with the new address!");

  // getting keys from contract
  const keys = await contract.getMyKeys();
  console.log("Keys:", keys);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
