import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Return current user info
  return NextResponse.json({ message: 'User info not implemented yet.' }, { status: 501 });
} 