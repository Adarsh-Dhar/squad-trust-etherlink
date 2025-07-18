// POST /roles/:roleId/verify
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const verification = await prisma.verification.create({
      data: {
        ...data,
        roleId: params.id,
      },
    });
    return NextResponse.json(verification);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This verifier has already verified this role.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to verify role.' }, { status: 500 });
  }
} 