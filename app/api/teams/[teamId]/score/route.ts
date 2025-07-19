// GET, POST /api/teams/:teamId/score
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateKPIScore } from '@/lib/credibility/kpi-scoring';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const score = await prisma.credibilityScore.findUnique({
      where: { teamId },
    });
    
    // If no score exists, return a default score
    if (!score) {
      return NextResponse.json({
        teamId,
        score: 0,
        lastUpdated: new Date(),
        details: {
          message: "No score calculated yet",
          milestoneCount: 0,
          completedCount: 0,
          kpiMilestoneCount: 0,
        }
      });
    }
    
    return NextResponse.json(score);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch score.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    
    // Get all projects for the team
    const projects = await prisma.project.findMany({
      where: { teamId },
      include: {
        milestones: true
      }
    });
    
    // Collect all milestones
    const allMilestones = projects.flatMap(project => project.milestones);
    
    // Convert to the format expected by calculateKPIScore
    const milestoneData = allMilestones.map(milestone => ({
      id: milestone.id,
      kpi: milestone.kpi || undefined,
      targetValue: milestone.targetValue || undefined,
      achievedValue: milestone.achievedValue || undefined,
      difficulty: milestone.difficulty || undefined,
      status: milestone.status || undefined,
      dueDate: milestone.dueDate || undefined,
      completed: milestone.completed,
    }));
    
    // Calculate KPI-based score
    const kpiScore = calculateKPIScore(milestoneData);
    
    // Convert kpiScore to plain object for Prisma JSON field
    const kpiScorePlain = {
      completionRate: kpiScore.completionRate,
      timeliness: kpiScore.timeliness,
      ambitionFactor: kpiScore.ambitionFactor,
      kpiAccuracy: kpiScore.kpiAccuracy,
      totalScore: kpiScore.totalScore,
    };
    
    // Update or create credibility score
    const credibilityScore = await prisma.credibilityScore.upsert({
      where: { teamId },
      update: {
        score: kpiScore.totalScore,
        lastUpdated: new Date(),
        details: {
          kpiScore: kpiScorePlain,
          milestoneCount: allMilestones.length,
          completedCount: allMilestones.filter(m => m.completed).length,
          kpiMilestoneCount: allMilestones.filter(m => m.kpi).length,
          lastCalculated: new Date().toISOString(),
        }
      },
      create: {
        teamId,
        score: kpiScore.totalScore,
        details: {
          kpiScore: kpiScorePlain,
          milestoneCount: allMilestones.length,
          completedCount: allMilestones.filter(m => m.completed).length,
          kpiMilestoneCount: allMilestones.filter(m => m.kpi).length,
          lastCalculated: new Date().toISOString(),
        }
      }
    });
    
    return NextResponse.json({
      message: 'Team credibility score updated successfully.',
      teamId,
      score: kpiScore.totalScore,
      details: kpiScore,
      credibilityScore
    });
    
  } catch (error) {
    console.error('Team score calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate team score.' }, { status: 500 });
  }
} 