// PATCH /projects/:id/finish
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await prisma.project.update({
      where: { id },
      data: { 
        status: 'FINISHED',
        completedAt: new Date()
      },
    });
    return NextResponse.json({ message: `Project ${id} marked as finished.`, project });
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Record not found
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to mark project as finished.' }, { status: 500 });
  }
} 