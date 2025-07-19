// PATCH /disputes/:id/reject
import { NextRequest, NextResponse } from 'next/server';
import { disputeSystem } from '@/lib/dispute';

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  try {
    const { reason } = await req.json();
    const dispute = await disputeSystem.rejectDispute(id, reason);
    return NextResponse.json(dispute);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }
    console.error('Reject dispute error:', error);
    return NextResponse.json({ error: 'Failed to reject dispute.' }, { status: 500 });
  }
} 