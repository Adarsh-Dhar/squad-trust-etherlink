const { ethers } = require('ethers');
require('dotenv').config();

// Final test summary for SquadTrust contracts
async function main() {
  console.log("🎯 SquadTrust Contract Test Summary");
  console.log("===================================");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Signer Address: ${signer.address}`);
  console.log(`RPC URL: ${process.env.RPC_URL}`);
  
  // Test SquadTrust Contract
  console.log("\n📋 Testing SquadTrust Core Functions...");
  const squadTrustAddress = "0x77A32245153578c93203D04a8C2EEf22741a0Ab4";
  
  const squadTrustABI = [
    "function createProject(string name, uint256 requiredConfirmations, uint256 budget, uint256 deadline) returns (bytes32)",
    "function completeProject(bytes32 projectId, uint256 actualCost)",
    "function claimRole(bytes32 projectId, string role) payable",
    "function verifyRole(bytes32 projectId, address member)",
    "function withdrawStake(bytes32 projectId)",
    "function getProject(bytes32 projectId) view returns (string name, address creator, bool completed, uint256 createdAt, uint256 completedAt, uint256 memberCount, uint256 budget, uint256 actualCost, uint256 deadline)",
    "function getMemberRole(bytes32 projectId, address member) view returns (string role, bool verified, uint256 stakeAmount, uint256 lastActivity)",
    "function getAllProjects() view returns (bytes32[])",
    "function getCredibilityScore(address member) view returns (uint256)"
  ];
  
  const results = {
    working: [],
    failed: []
  };
  
  try {
    const squadTrust = new ethers.Contract(squadTrustAddress, squadTrustABI, signer);
    
    // Test 1: Project Creation
    console.log("\n🚀 Testing: createProject");
    try {
      const projectName = "Final Test Project " + Date.now();
      const requiredConfirmations = 2;
      const budget = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      
      const createTx = await squadTrust.createProject(projectName, requiredConfirmations, budget, deadline);
      const receipt = await createTx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return squadTrust.interface.parseLog(log);
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = squadTrust.interface.parseLog(event);
        const projectId = parsed.args.projectId;
        console.log(`✅ PASS - Project created with ID: ${projectId}`);
        results.working.push("createProject");
        
        // Test 2: Role Claiming
        console.log("\n👤 Testing: claimRole");
        try {
          const role = "Developer";
          const stakeAmount = ethers.parseEther("0.01");
          const claimTx = await squadTrust.claimRole(projectId, role, { value: stakeAmount });
          await claimTx.wait();
          console.log(`✅ PASS - Role claimed: ${role}`);
          results.working.push("claimRole");
          
          // Test 3: Role Verification
          console.log("\n✅ Testing: verifyRole");
          try {
            const verifyTx = await squadTrust.verifyRole(projectId, signer.address);
            await verifyTx.wait();
            console.log(`✅ PASS - Role verified`);
            results.working.push("verifyRole");
            
            // Test 4: Project Completion
            console.log("\n🏁 Testing: completeProject");
            try {
              const actualCost = ethers.parseEther("950");
              const completeTx = await squadTrust.completeProject(projectId, actualCost);
              await completeTx.wait();
              console.log(`✅ PASS - Project completed`);
              results.working.push("completeProject");
              
              // Test 5: Stake Withdrawal
              console.log("\n💰 Testing: withdrawStake");
              try {
                const withdrawTx = await squadTrust.withdrawStake(projectId);
                await withdrawTx.wait();
                console.log(`✅ PASS - Stake withdrawn`);
                results.working.push("withdrawStake");
              } catch (error) {
                console.log(`❌ FAIL - withdrawStake: ${error.message}`);
                results.failed.push("withdrawStake");
              }
              
            } catch (error) {
              console.log(`❌ FAIL - completeProject: ${error.message}`);
              results.failed.push("completeProject");
            }
            
          } catch (error) {
            console.log(`❌ FAIL - verifyRole: ${error.message}`);
            results.failed.push("verifyRole");
          }
          
        } catch (error) {
          console.log(`❌ FAIL - claimRole: ${error.message}`);
          results.failed.push("claimRole");
        }
        
      }
      
    } catch (error) {
      console.log(`❌ FAIL - createProject: ${error.message}`);
      results.failed.push("createProject");
    }
    
  } catch (error) {
    console.log(`❌ FAIL - Contract initialization: ${error.message}`);
  }
  
  // Print Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Working Functions (${results.working.length}):`);
  results.working.forEach(func => console.log(`   - ${func}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed Functions (${results.failed.length}):`);
    results.failed.forEach(func => console.log(`   - ${func}`));
  }
  
  console.log("\n🎯 CLI COMMAND TO RUN ALL TESTS:");
  console.log("npm run test:contract");
  console.log("\n📝 Environment Variables Required:");
  console.log("- RPC_URL=http://127.0.0.1:8545");
  console.log("- PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("- SQUADTRUST_CONTRACT_ADDRESS=0x77A32245153578c93203D04a8C2EEf22741a0Ab4");
  
  console.log("\n✅ Test completed!");
}

main().catch(console.error); 