const { ethers } = require('ethers');

// Contract ABI (minimal for checking deployment)
const ABI = [
  "function getProjectsCount() view returns (uint256)",
  "function getProject(uint256) view returns (tuple(string name, address creator, uint256 minTeamStake, bool isActive))",
  "event ProjectCreated(uint256 indexed projectId, string name, address indexed creator, uint256 minTeamStake)"
];

async function checkContract() {
  console.log("=== CONTRACT DEPLOYMENT CHECK ===");
  
  // Get provider (using localhost for development)
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  // Contract addresses to check
  const addresses = [
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default from address.ts
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // From your logs
  ];
  
  for (const address of addresses) {
    console.log(`\n📋 Checking address: ${address}`);
    
    try {
      // Check if contract exists
      const code = await provider.getCode(address);
      console.log(`📦 Contract code exists: ${code !== "0x"}`);
      
      if (code === "0x") {
        console.log("❌ No contract deployed at this address");
        continue;
      }
      
      // Try to create contract instance
      const contract = new ethers.Contract(address, ABI, provider);
      
      // Test basic functions
      try {
        const projectCount = await contract.getProjectsCount();
        console.log(`✅ getProjectsCount() works: ${projectCount.toString()}`);
        
        if (projectCount > 0) {
          console.log("📊 Projects found on blockchain:");
          for (let i = 0; i < Math.min(Number(projectCount), 5); i++) {
            try {
              const project = await contract.getProject(i);
              console.log(`  Project ${i}: ${project.name} by ${project.creator}`);
            } catch (e) {
              console.log(`  Project ${i}: Error reading project`);
            }
          }
        }
      } catch (e) {
        console.log(`❌ getProjectsCount() failed: ${e.message}`);
      }
      
    } catch (e) {
      console.log(`❌ Error checking address: ${e.message}`);
    }
  }
  
  console.log("\n=== RECOMMENDATIONS ===");
  console.log("1. If no contracts are deployed, deploy your SquadTrust contract");
  console.log("2. If contracts exist but functions fail, check your contract ABI");
  console.log("3. Update your .env file with the correct contract address");
  console.log("4. Make sure you're connected to the right network");
}

checkContract().catch(console.error); 