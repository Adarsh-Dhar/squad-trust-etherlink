import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {
      creator: session.user.walletAddress.toLowerCase(),
    };
    
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
    console.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
} 