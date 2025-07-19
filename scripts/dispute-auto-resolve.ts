#!/usr/bin/env tsx

/**
 * Dispute Auto-Resolution Script
 * 
 * This script automatically resolves disputes that are older than 14 days.
 * It can be run as a cron job to handle dispute expiration.
 * 
 * Usage:
 * - npm run dispute:auto-resolve
 * - or run directly: tsx scripts/dispute-auto-resolve.ts
 */

import { disputeSystem } from '../lib/dispute';

async function main() {
  console.log('🔄 Starting dispute auto-resolution process...');
  
  try {
    // Get current stats
    const stats = await disputeSystem.getDisputeStats();
    console.log('📊 Current dispute statistics:', stats);
    
    // Auto-resolve expired disputes
    const resolveResult = await disputeSystem.autoResolveExpiredDisputes();
    console.log('✅ Auto-resolve result:', resolveResult);
    
    // Auto-ignore expired disputes
    const ignoreResult = await disputeSystem.autoIgnoreExpiredDisputes();
    console.log('❌ Auto-ignore result:', ignoreResult);
    
    // Get expiring disputes for warnings
    const expiringDisputes = await disputeSystem.getExpiringDisputes(3);
    if (expiringDisputes.length > 0) {
      console.log('⚠️  Disputes expiring in the next 3 days:', expiringDisputes.length);
      expiringDisputes.forEach(dispute => {
        console.log(`   - ${dispute.title} (ID: ${dispute.id})`);
      });
    }
    
    // Get updated stats
    const updatedStats = await disputeSystem.getDisputeStats();
    console.log('📊 Updated dispute statistics:', updatedStats);
    
    console.log('✅ Dispute auto-resolution process completed successfully!');
    
    // Return summary for logging
    return {
      resolved: resolveResult.resolved,
      ignored: ignoreResult.ignored,
      expiring: expiringDisputes.length,
      stats: updatedStats,
    };
    
  } catch (error) {
    console.error('❌ Error during dispute auto-resolution:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log('🎉 Script completed with result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { main as disputeAutoResolve }; 