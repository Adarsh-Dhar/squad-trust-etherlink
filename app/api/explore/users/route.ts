// GET /explore/users
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Return users for explore
  return NextResponse.json({ message: 'Explore users not implemented yet.' }, { status: 501 });
} 