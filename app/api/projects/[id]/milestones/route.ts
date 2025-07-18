// POST, GET /projects/:projectId/milestones
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        projectId: params.id,
      },
    });
    return NextResponse.json(milestone);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { projectId: params.id },
    });
    return NextResponse.json(milestones);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch milestones.' }, { status: 500 });
  }
} 