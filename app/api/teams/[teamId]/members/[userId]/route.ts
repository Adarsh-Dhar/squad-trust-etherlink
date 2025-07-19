// DELETE /teams/:teamId/members/:userId
// PATCH /teams/:teamId/members/:userId (for role updates)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTeamAdmin } from '@/lib/teams';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string, userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
    return NextResponse.json({ message: `User ${userId} removed from team ${teamId}.` });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string, userId: string }> }) {
  try {
    const { teamId, userId } = await params;
    const { role, updatedBy } = await req.json();

    if (!role || !updatedBy) {
      return NextResponse.json({ error: 'Role and updatedBy are required.' }, { status: 400 });
    }

    // Check if the updater is an admin
    const isUpdaterAdmin = await isTeamAdmin(teamId, updatedBy);
    if (!isUpdaterAdmin) {
      return NextResponse.json({ error: 'Only admins can update member roles.' }, { status: 403 });
    }

    // Prevent admins from demoting themselves (at least one admin must remain)
    if (userId === updatedBy && role === 'MEMBER') {
      const adminCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin. At least one admin must remain.' }, { status: 400 });
      }
    }

    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      message: `User ${userId} role updated to ${role}.`,
      member: updatedMember,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update member role.' }, { status: 500 });
  }
} 