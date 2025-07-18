// PATCH /projects/:id/complete
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: { status: 'COMPLETED' },
    });
    return NextResponse.json({ message: `Project ${params.id} marked as completed.`, project });
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Record not found
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to mark project as completed.' }, { status: 500 });
  }
} 