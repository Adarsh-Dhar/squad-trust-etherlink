import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const teams = await prisma.team.findMany();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, bio, website } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }
    // Optionally, handle tags here if you add a tags field to the Team model in the future
    const team = await prisma.team.create({
      data: {
        name,
        bio: bio || null,
        website: website || null,
      },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 });
  }
} 