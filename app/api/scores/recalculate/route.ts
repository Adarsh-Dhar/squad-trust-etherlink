// PATCH /scores/recalculate
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
  // TODO: Implement actual score recomputation logic
  return NextResponse.json({ message: 'Score recomputation triggered (stub).' });
} 