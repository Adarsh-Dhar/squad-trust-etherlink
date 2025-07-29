#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log("🔧 SquadTrust Contract Test Environment Setup");
console.log("=============================================");

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log("✅ .env file found");
  
  // Load and check environment variables
  require('dotenv').config();
  
  const requiredVars = [
    'RPC_URL',
    'PRIVATE_KEY', 
    'SQUADTRUST_CONTRACT_ADDRESS'
  ];
  
  console.log("\n📋 Environment Variables Status:");
  let allSet = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allSet = false;
    }
  });
  
  if (allSet) {
    console.log("\n🎉 All required environment variables are set!");
    console.log("You can now run: npm run test:contract");
  } else {
    console.log("\n⚠️  Some environment variables are missing.");
    console.log("Please add the missing variables to your .env file:");
    console.log("\nRequired variables:");
    console.log("- RPC_URL: Your blockchain RPC URL (e.g., http://127.0.0.1:8545)");
    console.log("- PRIVATE_KEY: Your private key for signing transactions");
    console.log("- SQUADTRUST_CONTRACT_ADDRESS: Deployed SquadTrust contract address");
  }
} else {
  console.log("❌ .env file not found");
  console.log("\n📝 Creating .env template...");
  
  const envTemplate = `# Database
DATABASE_URL="postgresql://username:password@localhost:5431/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Blockchain Configuration
SQUADTRUST_CONTRACT_ADDRESS="0x0b306bf915c4d645ff596e518faf3f9669b97016"
RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="your-private-key-for-server-side-transactions"

# Public Contract Address (for frontend)
NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS="0x0b306bf915c4d645ff596e518faf3f9669b97016"
`;
  
  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log("✅ .env file created successfully!");
    console.log("\n📝 Please edit the .env file and add your actual values:");
    console.log("- RPC_URL: Your blockchain RPC URL");
    console.log("- PRIVATE_KEY: Your private key");
    console.log("- SQUADTRUST_CONTRACT_ADDRESS: Your deployed contract address");
  } catch (error) {
    console.error("❌ Failed to create .env file:", error.message);
  }
}

console.log("\n🚀 Next steps:");
console.log("1. Edit .env file with your actual values");
console.log("2. Run: npm run test:contract");
console.log("3. Or run: node scripts/test-squadtrust-contract.js"); 