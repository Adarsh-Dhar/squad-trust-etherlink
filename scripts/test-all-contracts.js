const { ethers } = require('ethers');
require('dotenv').config();

// Comprehensive test for all SquadTrust contracts
async function main() {
  console.log("🧪 SquadTrust Comprehensive Contract Test");
  console.log("=========================================");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Signer Address: ${signer.address}`);
  
  // Test ExecutionNFT Contract
  console.log("\n📋 Testing ExecutionNFT Contract...");
  const executionNFTAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  
  const executionNFTABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function mint(address to, uint256 tokenId) external",
    "function setSquadTrustAddress(address _squadTrust) external"
  ];
  
  try {
    const executionNFT = new ethers.Contract(executionNFTAddress, executionNFTABI, signer);
    
    const name = await executionNFT.name();
    const symbol = await executionNFT.symbol();
    const totalSupply = await executionNFT.totalSupply();
    const balance = await executionNFT.balanceOf(signer.address);
    
    console.log(`✅ Name: ${name}`);
    console.log(`✅ Symbol: ${symbol}`);
    console.log(`✅ Total Supply: ${totalSupply.toString()}`);
    console.log(`✅ Balance: ${balance.toString()}`);
    
    // Test minting a token
    console.log("\n🪙 Testing token minting...");
    const tokenId = 1;
    const mintTx = await executionNFT.mint(signer.address, tokenId);
    await mintTx.wait();
    console.log(`✅ Minted token ${tokenId} to ${signer.address}`);
    
    // Check new balance
    const newBalance = await executionNFT.balanceOf(signer.address);
    console.log(`✅ New Balance: ${newBalance.toString()}`);
    
    // Check token ownership
    const owner = await executionNFT.ownerOf(tokenId);
    console.log(`✅ Token ${tokenId} owner: ${owner}`);
    
  } catch (error) {
    console.log("❌ ExecutionNFT Error:", error.message);
  }
  
  // Test SquadTrust Contract (if deployed)
  console.log("\n📋 Testing SquadTrust Contract...");
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
    "function getCredibilityScore(address member) view returns (uint256)",
    "function MIN_STAKE() view returns (uint256)",
    "function REPUTATION_THRESHOLD() view returns (uint256)",
    "function projectCount() view returns (uint256)"
  ];
  
  try {
    const squadTrust = new ethers.Contract(squadTrustAddress, squadTrustABI, signer);
    
    // Test constants
    console.log("\n🔢 Testing constants...");
    try {
      const minStake = await squadTrust.MIN_STAKE();
      console.log(`✅ MIN_STAKE: ${ethers.formatEther(minStake)} ETH`);
    } catch (error) {
      console.log("❌ MIN_STAKE failed:", error.message);
    }
    
    try {
      const reputationThreshold = await squadTrust.REPUTATION_THRESHOLD();
      console.log(`✅ REPUTATION_THRESHOLD: ${reputationThreshold.toString()}`);
    } catch (error) {
      console.log("❌ REPUTATION_THRESHOLD failed:", error.message);
    }
    
    try {
      const projectCount = await squadTrust.projectCount();
      console.log(`✅ Project Count: ${projectCount.toString()}`);
    } catch (error) {
      console.log("❌ Project Count failed:", error.message);
    }
    
    // Test project creation
    console.log("\n🚀 Testing project creation...");
    const projectName = "Test Project " + Date.now();
    const requiredConfirmations = 2;
    const budget = ethers.parseEther("1000");
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    
    try {
      const createTx = await squadTrust.createProject(projectName, requiredConfirmations, budget, deadline);
      const receipt = await createTx.wait();
      console.log(`✅ Project created successfully`);
      
      // Get project ID from event
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
        console.log(`✅ Project ID: ${projectId}`);
        
        // Test getting project details
        try {
          const project = await squadTrust.getProject(projectId);
          console.log(`✅ Project Name: ${project[0]}`);
          console.log(`✅ Project Creator: ${project[1]}`);
          console.log(`✅ Project Budget: ${ethers.formatEther(project[6])} ETH`);
        } catch (error) {
          console.log("❌ Get project failed:", error.message);
        }
        
        // Test role claiming
        console.log("\n👤 Testing role claiming...");
        const role = "Developer";
        const stakeAmount = ethers.parseEther("0.01");
        
        try {
          const claimTx = await squadTrust.claimRole(projectId, role, { value: stakeAmount });
          await claimTx.wait();
          console.log(`✅ Role claimed: ${role}`);
          
          // Test getting member role
          try {
            const memberRole = await squadTrust.getMemberRole(projectId, signer.address);
            console.log(`✅ Member Role: ${memberRole[0]}`);
            console.log(`✅ Verified: ${memberRole[1]}`);
            console.log(`✅ Stake Amount: ${ethers.formatEther(memberRole[2])} ETH`);
          } catch (error) {
            console.log("❌ Get member role failed:", error.message);
          }
          
        } catch (error) {
          console.log("❌ Role claiming failed:", error.message);
        }
        
        // Test role verification
        console.log("\n✅ Testing role verification...");
        try {
          const verifyTx = await squadTrust.verifyRole(projectId, signer.address);
          await verifyTx.wait();
          console.log(`✅ Role verified for ${signer.address}`);
        } catch (error) {
          console.log("❌ Role verification failed:", error.message);
        }
        
        // Test project completion
        console.log("\n🏁 Testing project completion...");
        const actualCost = ethers.parseEther("950");
        
        try {
          const completeTx = await squadTrust.completeProject(projectId, actualCost);
          await completeTx.wait();
          console.log(`✅ Project completed with cost: ${ethers.formatEther(actualCost)} ETH`);
          
          // Test credibility score
          try {
            const credibilityScore = await squadTrust.getCredibilityScore(signer.address);
            console.log(`✅ Credibility Score: ${credibilityScore.toString()}`);
          } catch (error) {
            console.log("❌ Get credibility score failed:", error.message);
          }
          
        } catch (error) {
          console.log("❌ Project completion failed:", error.message);
        }
        
        // Test stake withdrawal
        console.log("\n💰 Testing stake withdrawal...");
        try {
          const withdrawTx = await squadTrust.withdrawStake(projectId);
          await withdrawTx.wait();
          console.log(`✅ Stake withdrawn from project ${projectId}`);
        } catch (error) {
          console.log("❌ Stake withdrawal failed:", error.message);
        }
        
      }
      
    } catch (error) {
      console.log("❌ Project creation failed:", error.message);
    }
    
  } catch (error) {
    console.log("❌ SquadTrust contract error:", error.message);
  }
  
  console.log("\n✅ All tests completed!");
}

main().catch(console.error); 