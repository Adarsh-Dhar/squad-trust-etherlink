#!/usr/bin/env tsx

/**
 * Test Dispute Resolution System
 * 
 * This script creates test disputes and demonstrates the auto-resolution system.
 * It's useful for testing and demonstrating the dispute resolution functionality.
 */

import { disputeSystem } from '../lib/dispute';

async function createTestDisputes() {
  console.log('🧪 Creating test disputes...');
  
  try {
    // Create some test disputes
    const testDisputes = [
      {
        title: "Payment Delay Issue",
        description: "Payment has been delayed for more than 2 weeks"
      },
      {
        title: "Feature Request",
        description: "Request for new dashboard features"
      },
      {
        title: "Bug Report",
        description: "Critical bug in the authentication system"
      }
    ];

    const createdDisputes = [];
    for (const dispute of testDisputes) {
      const created = await disputeSystem.createDispute(dispute);
      createdDisputes.push(created);
      console.log(`✅ Created dispute: ${created.title} (ID: ${created.id})`);
    }

    return createdDisputes;
  } catch (error) {
    console.error('❌ Error creating test disputes:', error);
    throw error;
  }
}

async function demonstrateAutoResolution() {
  console.log('\n🔄 Demonstrating auto-resolution system...');
  
  try {
    // Get current stats
    const stats = await disputeSystem.getDisputeStats();
    console.log('📊 Current dispute statistics:', stats);
    
    // Get all disputes
    const disputes = await disputeSystem.getDisputes();
    console.log(`📋 Found ${disputes.length} disputes:`);
    disputes.forEach(dispute => {
      const daysUntilExpiry = disputeUtils.getDaysUntilExpiry(dispute, 14);
      console.log(`   - ${dispute.title} (${dispute.status}) - ${daysUntilExpiry} days until expiry`);
    });
    
    // Show expiring disputes
    const expiringDisputes = await disputeSystem.getExpiringDisputes(3);
    if (expiringDisputes.length > 0) {
      console.log(`⚠️  ${expiringDisputes.length} disputes expiring in the next 3 days`);
    } else {
      console.log('✅ No disputes expiring in the next 3 days');
    }
    
    // Run auto-resolution (should not affect recent disputes)
    const resolveResult = await disputeSystem.autoResolveExpiredDisputes();
    const ignoreResult = await disputeSystem.autoIgnoreExpiredDisputes();
    
    console.log('✅ Auto-resolve result:', resolveResult);
    console.log('❌ Auto-ignore result:', ignoreResult);
    
    // Get updated stats
    const updatedStats = await disputeSystem.getDisputeStats();
    console.log('📊 Updated dispute statistics:', updatedStats);
    
  } catch (error) {
    console.error('❌ Error demonstrating auto-resolution:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test disputes...');
  
  try {
    const disputes = await disputeSystem.getDisputes();
    for (const dispute of disputes) {
      await disputeSystem.deleteDispute(dispute.id);
      console.log(`🗑️  Deleted dispute: ${dispute.title}`);
    }
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function main() {
  console.log('🧪 Starting dispute system test...\n');
  
  try {
    // Create test disputes
    await createTestDisputes();
    
    // Demonstrate the system
    await demonstrateAutoResolution();
    
    // Cleanup (optional - comment out to keep test data)
    // await cleanup();
    
    console.log('\n🎉 Dispute system test completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Import utility functions
import { disputeUtils } from '../lib/dispute';

// Run the script if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { main as testDisputeSystem }; 