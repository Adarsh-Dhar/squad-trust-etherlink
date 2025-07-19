import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: {
          include: {
            milestones: true,
            funding: true,
          },
        },
        credibility: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team.' }, { status: 500 });
  }
} 