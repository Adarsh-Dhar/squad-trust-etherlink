// PATCH /milestones/:id/complete
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const milestone = await prisma.milestone.update({
      where: { id: params.id },
      data: { completed: true },
    });
    return NextResponse.json({ message: `Milestone ${params.id} marked as completed.`, milestone });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to mark milestone as completed.' }, { status: 500 });
  }
} 