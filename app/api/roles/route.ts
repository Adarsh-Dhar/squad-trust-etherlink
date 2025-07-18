import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Return list of roles
  return NextResponse.json({ message: 'List roles not implemented yet.' }, { status: 501 });
} 