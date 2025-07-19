// POST, GET /teams/:teamId/members
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const data = await req.json();
    
    // Check if the user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team.' }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: {
        ...data,
        teamId,
      },
    });
    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Team member creation error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User is already a member of this team.' }, { status: 409 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'User or team not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to add member.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members.' }, { status: 500 });
  }
} 