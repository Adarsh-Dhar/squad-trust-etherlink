#!/usr/bin/env node

const SquadTrustTester = require('./test-squadtrust-contract.js');

async function main() {
  console.log("🧪 SquadTrust Contract Test Suite");
  console.log("==================================");
  
  try {
    const tester = new SquadTrustTester();
    await tester.runAllTests();
  } catch (error) {
    console.error("❌ Test execution failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error); 