// PUT /roles/:id
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const role = await prisma.contributorRole.update({
      where: { id },
      data,
    });
    return NextResponse.json(role);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update role.' }, { status: 500 });
  }
} 