// PATCH /disputes/:id/resolve
import { NextRequest, NextResponse } from 'next/server';
import { disputeSystem } from '@/lib/dispute';

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  try {
    const dispute = await disputeSystem.resolveDispute(id);
    return NextResponse.json(dispute);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ error: 'Failed to resolve dispute.' }, { status: 500 });
  }
} 