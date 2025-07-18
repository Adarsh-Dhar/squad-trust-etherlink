import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Return user credibility score
  return NextResponse.json({ message: `Score for user ${params.id} not implemented yet.` }, { status: 501 });
} 