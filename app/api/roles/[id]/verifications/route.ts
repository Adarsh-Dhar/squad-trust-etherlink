// GET /roles/:roleId/verifications
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // TODO: Return verifications for role
  const { id } = await params;
  return NextResponse.json({ message: `Verifications for role ${id} not implemented yet.` }, { status: 501 });
} 