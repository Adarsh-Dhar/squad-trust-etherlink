const { ethers } = require('ethers');
require('dotenv').config();

// Simple test script for SquadTrust contract
async function main() {
  console.log("🧪 Simple SquadTrust Contract Test");
  console.log("===================================");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = process.env.SQUADTRUST_CONTRACT_ADDRESS;
  
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Signer Address: ${signer.address}`);
  
  // Test if contract is deployed
  const code = await provider.getCode(contractAddress);
  if (code === '0x') {
    console.log("❌ Contract not deployed at this address");
    return;
  }
  
  console.log("✅ Contract is deployed");
  
  // Test basic contract interaction
  try {
    // Try to call a simple function
    const contract = new ethers.Contract(contractAddress, [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)"
    ], signer);
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    
    console.log(`✅ Contract Name: ${name}`);
    console.log(`✅ Contract Symbol: ${symbol}`);
    console.log(`✅ Total Supply: ${totalSupply.toString()}`);
    
  } catch (error) {
    console.log("❌ Error calling contract functions:", error.message);
  }
  
  console.log("✅ Test completed");
}

main().catch(console.error); 