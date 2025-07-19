// POST, GET /teams/:teamId/members
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTeamAdmin } from '@/lib/teams';

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const data = await req.json();
    const { userId, role, grantedBy } = data;
    
    // Check if the user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team.' }, { status: 409 });
    }

    // If trying to grant admin role, check if the granter is an admin
    if (role === 'ADMIN' && grantedBy) {
      const isGranterAdmin = await isTeamAdmin(teamId, grantedBy);
      if (!isGranterAdmin) {
        return NextResponse.json({ error: 'Only admins can grant admin status to other members.' }, { status: 403 });
      }
    }

    // Normalize role to ensure it's a valid enum value
    const normalizedRole = role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    const member = await prisma.teamMember.create({
      data: {
        userId,
        role: normalizedRole,
        teamId,
      },
      include: {
        user: true,
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