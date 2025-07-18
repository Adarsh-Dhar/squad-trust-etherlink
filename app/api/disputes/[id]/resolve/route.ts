// PATCH /disputes/:id/resolve
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dispute = await prisma.dispute.update({
      where: { id: params.id },
      data: { resolved: true },
    });
    return NextResponse.json(dispute);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to resolve dispute.' }, { status: 500 });
  }
} 