// PATCH /milestones/:id/complete
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Mark milestone as completed
  return NextResponse.json({ message: `Mark milestone ${params.id} as completed (stub)` });
} 