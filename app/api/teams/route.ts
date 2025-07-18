// POST /teams, GET /teams
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const team = await prisma.team.create({ data });
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
} 