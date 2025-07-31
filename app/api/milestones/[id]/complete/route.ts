// PATCH /milestones/:id/complete
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VerificationType, DifficultyTier } from '@prisma/client';

interface MilestoneCompletionBody {
  achievedValue?: number;
  verificationData?: {
    verifierId: string;
    type?: VerificationType;
    dataSource?: string;
    confidence?: number;
    comment?: string;
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Safely parse request body
    let body: MilestoneCompletionBody = {};
    let achievedValue: number | undefined;
    let verificationData: MilestoneCompletionBody['verificationData'];
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        body = await req.json() as MilestoneCompletionBody;
        achievedValue = body.achievedValue;
        verificationData = body.verificationData;
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      // Continue with empty body if parsing fails
    }
    
    // Get the current milestone
    const currentMilestone = await prisma.milestone.findUnique({
      where: { id },
    });
    
    if (!currentMilestone) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    
    // Update milestone data
    const updateData: any = {
      completed: true,
      lastUpdated: new Date(),
    };
    
    // If this is a KPI milestone, update achieved value and status
    if (currentMilestone.kpi && achievedValue !== undefined) {
      updateData.achievedValue = achievedValue;
      
      // Determine status based on achievement
      if (achievedValue >= (currentMilestone.targetValue || 0)) {
        updateData.status = 'ACHIEVED';
      } else {
        updateData.status = 'FAILED';
      }
    } else {
      // For non-KPI milestones, just mark as completed
      updateData.status = 'ACHIEVED';
    }
    
    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });

    // --- TEAM SCORE UPDATE LOGIC ---
    // Get milestone with project and team
    const milestoneWithProject = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { include: { team: true } } },
    });
    if (milestoneWithProject?.project?.teamId && milestoneWithProject.difficulty) {
      const teamId = milestoneWithProject.project.teamId;
      const difficulty = milestoneWithProject.difficulty as DifficultyTier;
      // Difficulty multipliers
      const DIFFICULTY_MULTIPLIER: Record<DifficultyTier, number> = {
        EASY: 1,
        MEDIUM: 2,
        HARD: 4,
        EXPERT: 8,
      };
      const baseScore = 10;
      const scoreToAdd = baseScore * DIFFICULTY_MULTIPLIER[difficulty];
      // Upsert team credibility score
      await prisma.credibilityScore.upsert({
        where: { teamId },
        update: { score: { increment: scoreToAdd }, lastUpdated: new Date() },
        create: { teamId, score: scoreToAdd, lastUpdated: new Date() },
      });
    }
    // --- END TEAM SCORE UPDATE LOGIC ---
    
    // If verification data is provided, create verification record
    if (verificationData && currentMilestone.kpi) {
      await prisma.milestoneVerification.create({
        data: {
          milestoneId: id,
          verifierId: verificationData.verifierId,
          verificationType: verificationData.type || VerificationType.MANUAL_VERIFICATION,
          dataSource: verificationData.dataSource,
          verifiedValue: achievedValue,
          confidence: verificationData.confidence || 1.0,
          comment: verificationData.comment,
        }
      });
    }
    
    return NextResponse.json({ 
      message: `Milestone ${id} marked as completed.`, 
      milestone,
      kpiAchieved: currentMilestone.kpi ? (achievedValue !== undefined && achievedValue >= (currentMilestone.targetValue || 0)) : null
    });
  } catch (error: any) {
    console.error('Milestone completion error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to mark milestone as completed.' }, { status: 500 });
  }
} 