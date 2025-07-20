const { ethers } = require('ethers');

async function testContract() {
  try {
    // Connect to local blockchain
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Contract address from environment
    const contractAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
    
    // Check if contract is deployed
    const code = await provider.getCode(contractAddress);
    console.log("Contract code at", contractAddress, ":", code);
    
    if (code === "0x") {
      console.log("❌ Contract is NOT deployed at", contractAddress);
      return;
    }
    
    console.log("✅ Contract is deployed at", contractAddress);
    
    // Try to get the project count
    const abi = [
      "function projectCount() view returns (uint256)",
      "function createProject(string name, uint256 requiredConfirmations) returns (bytes32)",
      "event ProjectCreated(bytes32 indexed projectId, address indexed creator, string name, uint256 timestamp)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
      const projectCount = await contract.projectCount();
      console.log("✅ Project count:", projectCount.toString());
    } catch (e) {
      console.log("❌ Failed to get project count:", e.message);
    }
    
    // Try to create a test project
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log("❌ No PRIVATE_KEY in environment");
      return;
    }
    
    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(signer);
    
    try {
      console.log("Creating test project...");
      const tx = await contractWithSigner.createProject("Test Project", 2);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      console.log("Transaction logs:", receipt.logs);
      
      // Try to parse the event
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`Log ${i}:`, log);
        try {
          const parsedLog = contract.interface.parseLog(log);
          console.log(`Parsed log ${i}:`, parsedLog);
          if (parsedLog?.name === 'ProjectCreated') {
            console.log("✅ Found ProjectCreated event!");
            console.log("Project ID:", parsedLog.args.projectId.toString());
            break;
          }
        } catch (e) {
          console.log(`Failed to parse log ${i}:`, e.message);
        }
      }
      
    } catch (e) {
      console.log("❌ Failed to create test project:", e.message);
    }
    
  } catch (error) {
    console.error("Error testing contract:", error);
  }
}

testContract(); 