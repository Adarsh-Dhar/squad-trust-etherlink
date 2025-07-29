const { ethers } = require('ethers');
require('dotenv').config();

// SquadTrust Simple Contract ABI - Core functions
const SQUADTRUST_ABI = [
  // Core Project Functions
  "function createProject(string name, uint256 requiredConfirmations, uint256 budget, uint256 deadline) returns (bytes32)",
  "function completeProject(bytes32 projectId, uint256 actualCost)",
  
  // Role Management
  "function claimRole(bytes32 projectId, string role) payable",
  "function verifyRole(bytes32 projectId, address member)",
  "function withdrawStake(bytes32 projectId)",
  
  // View Functions
  "function getProject(bytes32 projectId) view returns (string name, address creator, bool completed, uint256 createdAt, uint256 completedAt, uint256 memberCount, uint256 budget, uint256 actualCost, uint256 deadline)",
  "function getMemberRole(bytes32 projectId, address member) view returns (string role, bool verified, uint256 stakeAmount, uint256 lastActivity)",
  "function getMemberProjects(address member) view returns (bytes32[])",
  "function getProjectMembers(bytes32 projectId) view returns (address[])",
  "function getCredibilityScore(address member) view returns (uint256)",
  "function getAllProjects() view returns (bytes32[])",
  "function getProjectRoles(bytes32 projectId) view returns (address[] members, string[] roles)",
  
  // Constants
  "function MIN_STAKE() view returns (uint256)",
  "function REPUTATION_THRESHOLD() view returns (uint256)",
  "function projectCount() view returns (uint256)",
  "function nonces(address) view returns (uint256)",
  
  // Events
  "event ProjectCreated(bytes32 indexed projectId, address indexed creator, string name, uint256 timestamp)",
  "event ProjectCompleted(bytes32 indexed projectId, address indexed team, uint256 credibilityImpact, uint256 timestamp)",
  "event RoleVerified(address indexed member, bytes32 indexed projectId, string role, uint256 timestamp)"
];

class SquadTrustTester {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.privateKey = process.env.PRIVATE_KEY;
    this.contractAddress = process.env.SQUADTRUST_CONTRACT_ADDRESS;
    
    if (!this.privateKey || !this.contractAddress) {
      throw new Error("Missing PRIVATE_KEY or SQUADTRUST_CONTRACT_ADDRESS in .env");
    }
    
    this.signer = new ethers.Wallet(this.privateKey, this.provider);
    this.contract = new ethers.Contract(this.contractAddress, SQUADTRUST_ABI, this.signer);
    
    // Test addresses
    this.testAddresses = {
      alice: this.signer.address,
      bob: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      carol: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      dave: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      eve: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    };
    
    this.testResults = [];
  }

  async log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testFunction(name, testFn) {
    try {
      await this.log(`Testing: ${name}`);
      const result = await testFn();
      this.testResults.push({ name, status: "PASS", result });
      await this.log(`${name}: PASS`, "success");
      return result;
    } catch (error) {
      this.testResults.push({ name, status: "FAIL", error: error.message });
      await this.log(`${name}: FAIL - ${error.message}`, "error");
      return null;
    }
  }

  async testConstants() {
    await this.log("=== Testing Constants ===");
    
    await this.testFunction("MIN_STAKE", async () => {
      const minStake = await this.contract.MIN_STAKE();
      return ethers.formatEther(minStake);
    });
    
    await this.testFunction("REPUTATION_THRESHOLD", async () => {
      return await this.contract.REPUTATION_THRESHOLD();
    });
    
    await this.testFunction("projectCount", async () => {
      return await this.contract.projectCount();
    });
  }

  async testProjectCreation() {
    await this.log("=== Testing Project Creation ===");
    
    const projectName = "Test Project " + Date.now();
    const requiredConfirmations = 2;
    const budget = ethers.parseEther("1000");
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    
    const projectId = await this.testFunction("createProject", async () => {
      const tx = await this.contract.createProject(projectName, requiredConfirmations, budget, deadline);
      const receipt = await tx.wait();
      
      // Get the ProjectCreated event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        return parsed.args.projectId;
      }
      
      return null;
    });
    
    if (projectId) {
      await this.testFunction("getProject", async () => {
        const project = await this.contract.getProject(projectId);
        return {
          name: project[0],
          creator: project[1],
          completed: project[2],
          memberCount: project[5].toString(),
          budget: ethers.formatEther(project[6])
        };
      });
      
      await this.testFunction("getAllProjects", async () => {
        return await this.contract.getAllProjects();
      });
      
      return projectId;
    }
    
    return null;
  }

  async testRoleClaiming(projectId) {
    if (!projectId) return;
    
    await this.log("=== Testing Role Claiming ===");
    
    const role = "Developer";
    const stakeAmount = ethers.parseEther("0.01");
    
    await this.testFunction("claimRole", async () => {
      const tx = await this.contract.claimRole(projectId, role, { value: stakeAmount });
      await tx.wait();
      return { projectId, role, stakeAmount: ethers.formatEther(stakeAmount) };
    });
    
    await this.testFunction("getMemberRole", async () => {
      const memberRole = await this.contract.getMemberRole(projectId, this.signer.address);
      return {
        role: memberRole[0],
        verified: memberRole[1],
        stakeAmount: ethers.formatEther(memberRole[2]),
        lastActivity: memberRole[3].toString()
      };
    });
    
    await this.testFunction("getProjectMembers", async () => {
      return await this.contract.getProjectMembers(projectId);
    });
    
    await this.testFunction("getProjectRoles", async () => {
      const roles = await this.contract.getProjectRoles(projectId);
      return {
        members: roles[0],
        roles: roles[1]
      };
    });
  }

  async testRoleVerification(projectId) {
    if (!projectId) return;
    
    await this.log("=== Testing Role Verification ===");
    
    await this.testFunction("verifyRole", async () => {
      const tx = await this.contract.verifyRole(projectId, this.signer.address);
      await tx.wait();
      return { projectId, member: this.signer.address };
    });
    
    // Test the verified role
    await this.testFunction("getMemberRole (after verification)", async () => {
      const memberRole = await this.contract.getMemberRole(projectId, this.signer.address);
      return {
        role: memberRole[0],
        verified: memberRole[1],
        stakeAmount: ethers.formatEther(memberRole[2])
      };
    });
  }

  async testProjectCompletion(projectId) {
    if (!projectId) return;
    
    await this.log("=== Testing Project Completion ===");
    
    const actualCost = ethers.parseEther("950"); // Under budget
    
    await this.testFunction("completeProject", async () => {
      const tx = await this.contract.completeProject(projectId, actualCost);
      await tx.wait();
      return { projectId, actualCost: ethers.formatEther(actualCost) };
    });
    
    // Test reputation updates
    await this.testFunction("getCredibilityScore", async () => {
      return await this.contract.getCredibilityScore(this.signer.address);
    });
    
    await this.testFunction("getMemberProjects", async () => {
      return await this.contract.getMemberProjects(this.signer.address);
    });
  }

  async testStakeWithdrawal(projectId) {
    if (!projectId) return;
    
    await this.log("=== Testing Stake Withdrawal ===");
    
    await this.testFunction("withdrawStake", async () => {
      const tx = await this.contract.withdrawStake(projectId);
      await tx.wait();
      return { projectId };
    });
  }

  async runAllTests() {
    await this.log("🚀 Starting SquadTrust Contract Tests");
    await this.log(`Contract Address: ${this.contractAddress}`);
    await this.log(`Signer Address: ${this.signer.address}`);
    
    // Test constants first
    await this.testConstants();
    
    // Test project creation
    const projectId = await this.testProjectCreation();
    
    // Test role claiming
    await this.testRoleClaiming(projectId);
    
    // Test role verification
    await this.testRoleVerification(projectId);
    
    // Test project completion
    await this.testProjectCompletion(projectId);
    
    // Test stake withdrawal
    await this.testStakeWithdrawal(projectId);
    
    // Print summary
    await this.printSummary();
  }

  async printSummary() {
    await this.log("=== Test Summary ===");
    
    const passed = this.testResults.filter(r => r.status === "PASS").length;
    const failed = this.testResults.filter(r => r.status === "FAIL").length;
    const total = this.testResults.length;
    
    await this.log(`Total Tests: ${total}`);
    await this.log(`Passed: ${passed}`, "success");
    await this.log(`Failed: ${failed}`, failed > 0 ? "error" : "success");
    
    if (failed > 0) {
      await this.log("Failed Tests:");
      this.testResults
        .filter(r => r.status === "FAIL")
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    await this.log("=== End of Tests ===");
  }
}

// Main execution
async function main() {
  try {
    const tester = new SquadTrustTester();
    await tester.runAllTests();
  } catch (error) {
    console.error("❌ Test execution failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SquadTrustTester; 