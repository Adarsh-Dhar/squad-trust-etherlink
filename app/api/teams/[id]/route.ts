// GET, PUT, DELETE /teams/:id
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: { members: true, projects: true, credibility: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const team = await prisma.team.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(team);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update team.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.team.delete({ where: { id: params.id } });
    return NextResponse.json({ message: `Team ${params.id} deleted.` });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete team.' }, { status: 500 });
  }
} 