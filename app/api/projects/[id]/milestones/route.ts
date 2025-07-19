// POST, GET /projects/:projectId/milestones
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDifficultyTier } from '@/lib/credibility/kpi-scoring';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const data = await req.json();
    
    // Validate KPI data if provided
    if (data.kpi && !data.targetValue) {
      return NextResponse.json({ error: 'Target value is required when KPI is specified.' }, { status: 400 });
    }
    
    // Ensure dueDate is a valid Date or undefined
    let dueDate = data.dueDate;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed.toISOString();
      } else {
        dueDate = undefined;
      }
    } else {
      dueDate = undefined;
    }
    
    // Auto-determine difficulty if KPI is provided
    let difficulty = data.difficulty;
    if (data.kpi && data.targetValue && !difficulty) {
      difficulty = getDifficultyTier(data.kpi, data.targetValue);
    }
    
    // Set default status based on KPI presence
    const status = data.kpi ? 'PENDING' : (data.completed ? 'ACHIEVED' : 'PENDING');
    
    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        dueDate,
        projectId: id,
        status,
        difficulty,
        lastUpdated: new Date(),
      },
    });
    return NextResponse.json(milestone);
  } catch (error) {
    console.error('Milestone creation error:', error);
    return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
      include: {
        verifiers: {
          include: {
            verifier: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(milestones);
  } catch (error) {
    console.error('Milestone fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones.' }, { status: 500 });
  }
} 