// GET /users/:userId/score
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const score = await prisma.credibilityScore.findUnique({
      where: { userId: params.userId },
    });
    if (!score) {
      return NextResponse.json({ error: 'Score not found.' }, { status: 404 });
    }
    return NextResponse.json(score);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch score.' }, { status: 500 });
  }
} 