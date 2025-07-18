// POST, GET /teams/:teamId/members
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const data = await req.json();
    const member = await prisma.teamMember.create({
      data: {
        ...data,
        teamId: params.teamId,
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add member.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId: params.teamId },
      include: { user: true },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members.' }, { status: 500 });
  }
} 