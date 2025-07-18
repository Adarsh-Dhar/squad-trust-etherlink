// GET /users/wallet/:walletAddress
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { walletAddress: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: params.walletAddress },
      include: { teams: true, roles: true, verifications: true, credibility: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user.' }, { status: 500 });
  }
} 