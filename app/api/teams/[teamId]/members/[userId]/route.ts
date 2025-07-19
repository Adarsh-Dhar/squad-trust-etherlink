// DELETE /teams/:teamId/members/:userId
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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