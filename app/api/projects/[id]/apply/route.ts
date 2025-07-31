import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await req.json();
    const { 
      coverLetter, 
      proposedStake, 
      quoteAmount, 
      teamExperience, 
      deadline 
    } = body;

    // Validate required fields
    if (!coverLetter || !proposedStake || !quoteAmount || !deadline) {
      return NextResponse.json({ 
        error: 'Cover letter, proposed stake, quote amount, and deadline are required' 
      }, { status: 400 });
    }

    // Validate numeric fields
    if (isNaN(proposedStake) || isNaN(quoteAmount) || proposedStake <= 0 || quoteAmount <= 0) {
      return NextResponse.json({ 
        error: 'Proposed stake and quote amount must be positive numbers' 
      }, { status: 400 });
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return NextResponse.json({ 
        error: 'Deadline must be in the future' 
      }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: session.user.walletAddress.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if project exists and is hiring
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status !== 'HIRING') {
      return NextResponse.json({ error: 'Project is not currently hiring' }, { status: 400 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        projectId,
        applicantId: user.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this project' }, { status: 400 });
    }

    // Get user's team score (you can implement your own scoring logic here)
    const userScoreData = await prisma.userScoreData.findUnique({
      where: { userId: user.id },
    });

    const teamScore = userScoreData?.credibilityScore || 0.0;

    // Create the application
    const application = await prisma.application.create({
      data: {
        projectId,
        applicantId: user.id,
        coverLetter,
        proposedStake: parseFloat(proposedStake),
        quoteAmount: parseFloat(quoteAmount),
        teamExperience: teamExperience || null,
        deadline: deadlineDate,
        teamScore,
      },
      include: {
        applicant: true,
        project: {
          include: {
            team: true,
          },
        },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    const applications = await prisma.application.findMany({
      where: { projectId },
      include: {
        applicant: {
          include: {
            teams: {
              include: {
                team: true,
              },
            },
          },
        },
        project: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
} 