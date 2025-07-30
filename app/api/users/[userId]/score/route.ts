import { NextRequest, NextResponse } from 'next/server';
import { calculateScore, getReputationBreakdown } from '@/lib/score';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id },
      select: { walletAddress: true, name: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate score using wallet address
    const score = calculateScore(user.walletAddress);
    const breakdown = getReputationBreakdown(user.walletAddress);
    
    return NextResponse.json({
      userId: id,
      walletAddress: user.walletAddress,
      userName: user.name,
      score,
      breakdown,
      calculatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('User score calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate user score' }, { status: 500 });
  }
} 