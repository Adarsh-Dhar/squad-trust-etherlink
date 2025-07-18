// GET /explore/teams
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Return teams for explore
  return NextResponse.json({ message: 'Explore teams not implemented yet.' }, { status: 501 });
} 