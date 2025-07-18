// GET /roles/:roleId/verifications
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const verifications = await prisma.verification.findMany({
      where: { roleId: params.id },
      include: { verifier: true },
    });
    return NextResponse.json(verifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch verifications.' }, { status: 500 });
  }
} 