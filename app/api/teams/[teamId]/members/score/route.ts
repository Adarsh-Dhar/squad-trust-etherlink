import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScore } from '@/lib/score';

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;

    // Get all team members
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    if (members.length === 0) {
      return NextResponse.json({
        message: 'No members found for this team.',
        teamId,
        memberScores: [],
        calculatedAt: new Date().toISOString()
      });
    }

    // Calculate scores for each member
    const memberScores = members.map(member => {
      const memberAddress = member.user.walletAddress || member.user.id;
      const score = calculateScore(memberAddress);
      
      return {
        userId: member.userId,
        memberAddress,
        userName: member.user.name || 'Unknown',
        score,
        role: member.role
      };
    });

    // Calculate team average score
    const totalScore = memberScores.reduce((sum, member) => sum + member.score, 0);
    const averageScore = memberScores.length > 0 ? totalScore / memberScores.length : 0;

    return NextResponse.json({
      message: 'Team member scores calculated successfully.',
      teamId,
      memberScores,
      averageScore: Math.round(averageScore),
      totalMembers: memberScores.length,
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Member score calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate member scores.' }, { status: 500 });
  }
} 