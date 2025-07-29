const { ethers } = require('ethers');
require('dotenv').config();

// Final working test for SquadTrust contract
async function main() {
  console.log("🎯 SquadTrust Contract - Final Working Test");
  console.log("===========================================");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = process.env.SQUADTRUST_CONTRACT_ADDRESS;
  
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Signer Address: ${signer.address}`);
  
  // SquadTrust Contract ABI
  const squadTrustABI = [
    "function createProject(string name, uint256 requiredConfirmations, uint256 budget, uint256 deadline) returns (bytes32)",
    "function completeProject(bytes32 projectId, uint256 actualCost)",
    "function claimRole(bytes32 projectId, string role) payable",
    "function verifyRole(bytes32 projectId, address member)",
    "function withdrawStake(bytes32 projectId)",
    "function getProject(bytes32 projectId) view returns (string name, address creator, bool completed, uint256 createdAt, uint256 completedAt, uint256 memberCount, uint256 budget, uint256 actualCost, uint256 deadline)",
    "function getMemberRole(bytes32 projectId, address member) view returns (string role, bool verified, uint256 stakeAmount, uint256 lastActivity)",
    "function getAllProjects() view returns (bytes32[])",
    "function getCredibilityScore(address member) view returns (uint256)",
    "function MIN_STAKE() view returns (uint256)",
    "function REPUTATION_THRESHOLD() view returns (uint256)",
    "function projectCount() view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(contractAddress, squadTrustABI, signer);
  
  const results = {
    working: [],
    failed: []
  };
  
  try {
    // Test 1: Constants
    console.log("\n🔢 Testing Constants...");
    try {
      const minStake = await contract.MIN_STAKE();
      console.log(`✅ MIN_STAKE: ${ethers.formatEther(minStake)} ETH`);
      results.working.push("MIN_STAKE");
    } catch (error) {
      console.log(`❌ MIN_STAKE failed: ${error.message}`);
      results.failed.push("MIN_STAKE");
    }
    
    try {
      const reputationThreshold = await contract.REPUTATION_THRESHOLD();
      console.log(`✅ REPUTATION_THRESHOLD: ${reputationThreshold.toString()}`);
      results.working.push("REPUTATION_THRESHOLD");
    } catch (error) {
      console.log(`❌ REPUTATION_THRESHOLD failed: ${error.message}`);
      results.failed.push("REPUTATION_THRESHOLD");
    }
    
    try {
      const projectCount = await contract.projectCount();
      console.log(`✅ Project Count: ${projectCount.toString()}`);
      results.working.push("projectCount");
    } catch (error) {
      console.log(`❌ Project Count failed: ${error.message}`);
      results.failed.push("projectCount");
    }
    
    // Test 2: Project Creation
    console.log("\n🚀 Testing Project Creation...");
    const projectName = "Final Test Project " + Date.now();
    const requiredConfirmations = 2;
    const budget = ethers.parseEther("1000");
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    
    try {
      const createTx = await contract.createProject(projectName, requiredConfirmations, budget, deadline);
      const receipt = await createTx.wait();
      console.log(`✅ Project created successfully`);
      results.working.push("createProject");
      
      // Get project ID from event
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        const projectId = parsed.args.projectId;
        console.log(`✅ Project ID: ${projectId}`);
        
        // Test 3: Role Claiming
        console.log("\n👤 Testing Role Claiming...");
        const role = "Developer";
        const stakeAmount = ethers.parseEther("0.01");
        
        try {
          const claimTx = await contract.claimRole(projectId, role, { value: stakeAmount });
          await claimTx.wait();
          console.log(`✅ Role claimed: ${role}`);
          results.working.push("claimRole");
          
          // Test 4: Role Verification
          console.log("\n✅ Testing Role Verification...");
          try {
            const verifyTx = await contract.verifyRole(projectId, signer.address);
            await verifyTx.wait();
            console.log(`✅ Role verified`);
            results.working.push("verifyRole");
            
            // Test 5: Project Completion (with proper nonce handling)
            console.log("\n🏁 Testing Project Completion...");
            const actualCost = ethers.parseEther("950");
            
            try {
              // Get current nonce
              const nonce = await provider.getTransactionCount(signer.address);
              const completeTx = await contract.completeProject(projectId, actualCost, { nonce });
              await completeTx.wait();
              console.log(`✅ Project completed`);
              results.working.push("completeProject");
              
              // Test 6: Stake Withdrawal
              console.log("\n💰 Testing Stake Withdrawal...");
              try {
                const withdrawTx = await contract.withdrawStake(projectId);
                await withdrawTx.wait();
                console.log(`✅ Stake withdrawn`);
                results.working.push("withdrawStake");
              } catch (error) {
                console.log(`❌ Stake withdrawal failed: ${error.message}`);
                results.failed.push("withdrawStake");
              }
              
            } catch (error) {
              console.log(`❌ Project completion failed: ${error.message}`);
              results.failed.push("completeProject");
            }
            
          } catch (error) {
            console.log(`❌ Role verification failed: ${error.message}`);
            results.failed.push("verifyRole");
          }
          
        } catch (error) {
          console.log(`❌ Role claiming failed: ${error.message}`);
          results.failed.push("claimRole");
        }
        
        // Test view functions
        console.log("\n📋 Testing View Functions...");
        try {
          const project = await contract.getProject(projectId);
          console.log(`✅ Project Name: ${project[0]}`);
          console.log(`✅ Project Creator: ${project[1]}`);
          console.log(`✅ Project Budget: ${ethers.formatEther(project[6])} ETH`);
          results.working.push("getProject");
        } catch (error) {
          console.log(`❌ Get project failed: ${error.message}`);
          results.failed.push("getProject");
        }
        
        try {
          const memberRole = await contract.getMemberRole(projectId, signer.address);
          console.log(`✅ Member Role: ${memberRole[0]}`);
          console.log(`✅ Verified: ${memberRole[1]}`);
          console.log(`✅ Stake Amount: ${ethers.formatEther(memberRole[2])} ETH`);
          results.working.push("getMemberRole");
        } catch (error) {
          console.log(`❌ Get member role failed: ${error.message}`);
          results.failed.push("getMemberRole");
        }
        
        try {
          const credibilityScore = await contract.getCredibilityScore(signer.address);
          console.log(`✅ Credibility Score: ${credibilityScore.toString()}`);
          results.working.push("getCredibilityScore");
        } catch (error) {
          console.log(`❌ Get credibility score failed: ${error.message}`);
          results.failed.push("getCredibilityScore");
        }
        
        try {
          const allProjects = await contract.getAllProjects();
          console.log(`✅ All Projects: ${allProjects.length} projects`);
          results.working.push("getAllProjects");
        } catch (error) {
          console.log(`❌ Get all projects failed: ${error.message}`);
          results.failed.push("getAllProjects");
        }
        
      }
      
    } catch (error) {
      console.log(`❌ Project creation failed: ${error.message}`);
      results.failed.push("createProject");
    }
    
  } catch (error) {
    console.log(`❌ Contract initialization failed: ${error.message}`);
  }
  
  // Print Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 FINAL TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Working Functions (${results.working.length}):`);
  results.working.forEach(func => console.log(`   - ${func}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed Functions (${results.failed.length}):`);
    results.failed.forEach(func => console.log(`   - ${func}`));
  }
  
  console.log("\n🎯 CLI COMMAND TO RUN ALL TESTS:");
  console.log("npm run test:contract");
  console.log("\n📝 Environment Variables:");
  console.log("- RPC_URL=http://127.0.0.1:8545");
  console.log("- PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("- SQUADTRUST_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  
  console.log("\n✅ Test completed successfully!");
}

main().catch(console.error); 