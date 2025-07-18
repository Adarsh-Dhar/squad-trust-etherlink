// DELETE /teams/:teamId/members/:userId
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { teamId: string, userId: string } }) {
  try {
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: params.userId,
        },
      },
    });
    return NextResponse.json({ message: `User ${params.userId} removed from team ${params.teamId}.` });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 });
  }
} 