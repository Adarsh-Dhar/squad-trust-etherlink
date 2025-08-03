import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    const projects = await prisma.project.findMany({
      where,
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        funding: true,
        roles: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, githubRepo, liveUrl, minTeamStake = "0.1", blockchainProjectId, txHash } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Validate onchain data is provided
    if (!blockchainProjectId) {
      return NextResponse.json({ error: 'Blockchain project ID is required' }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: session.user.walletAddress.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create the project in database with onchain data
    // Note: No team is associated initially - teams will apply for the project
    const project = await prisma.project.create({
      data: {
        name: title,
        description,
        githubRepo: githubRepo || null,
        liveUrl: liveUrl || null,
        status: 'HIRING',
        creator: session.user.walletAddress.toLowerCase(),
        teamId: null, // No team associated initially
        blockchainProjectId: blockchainProjectId,
        minimumStake: parseFloat(minTeamStake),
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        milestones: true,
        funding: true,
        roles: true,
      },
    });

    return NextResponse.json({
      ...project,
      message: 'Project created successfully. Teams can now apply for this project.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 