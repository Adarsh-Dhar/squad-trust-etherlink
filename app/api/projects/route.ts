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
    const { title, description, githubRepo, liveUrl } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: session.user.walletAddress.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create a placeholder team for the project creator
    // This allows projects to be created without requiring an existing team
    const placeholderTeam = await prisma.team.create({
      data: {
        name: `${user.name || 'Anonymous'}'s Project Team`,
        bio: `Team for ${title}`,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    // Create the project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        githubRepo: githubRepo || null,
        liveUrl: liveUrl || null,
        status: 'ONGOING',
        creator: session.user.walletAddress.toLowerCase(),
        teamId: placeholderTeam.id,
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 