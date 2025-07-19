// POST, GET /projects/:projectId/roles
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const role = await prisma.contributorRole.create({
      data: {
        ...data,
        projectId: id,
      },
    });
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to claim role.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roles = await prisma.contributorRole.findMany({
      where: { projectId: id },
      include: { verifications: true, user: true },
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles.' }, { status: 500 });
  }
} 