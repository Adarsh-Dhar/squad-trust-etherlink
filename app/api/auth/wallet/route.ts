import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: Implement wallet authentication logic (e.g., SIWE)
  return NextResponse.json({ message: 'Wallet auth not implemented yet.' }, { status: 501 });
} 