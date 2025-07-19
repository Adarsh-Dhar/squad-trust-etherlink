// POST, GET /projects/:projectId/funding
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const funding = await prisma.funding.create({
      data: {
        ...data,
        projectId: id,
      },
    });
    return NextResponse.json(funding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log funding.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const funding = await prisma.funding.findMany({
      where: { projectId: id },
    });
    return NextResponse.json(funding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch funding.' }, { status: 500 });
  }
} 