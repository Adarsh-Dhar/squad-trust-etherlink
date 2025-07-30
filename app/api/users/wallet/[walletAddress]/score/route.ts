import { NextRequest, NextResponse } from 'next/server';
import { calculateScore, getReputationBreakdown } from '@/lib/score';

export async function GET(req: NextRequest, { params }: { params: Promise<{ walletAddress: string }> }) {
  try {
    const { walletAddress } = await params;
    
    // Calculate score using wallet address
    const score = calculateScore(walletAddress);
    const breakdown = getReputationBreakdown(walletAddress);
    
    return NextResponse.json({
      walletAddress,
      score,
      breakdown,
      calculatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Wallet score calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate wallet score' }, { status: 500 });
  }
} 