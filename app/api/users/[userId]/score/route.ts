import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // TODO: Return user credibility score
  const { id } = await params;
  return NextResponse.json({ message: `Score for user ${id} not implemented yet.` }, { status: 501 });
} 