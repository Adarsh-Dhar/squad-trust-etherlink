// GET /explore/teams
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // You can add filter logic here if needed
    const teams = await prisma.team.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
} 