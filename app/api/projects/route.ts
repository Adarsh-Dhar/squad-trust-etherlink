import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Return list of projects
  return NextResponse.json({ message: 'List projects not implemented yet.' }, { status: 501 });
} 