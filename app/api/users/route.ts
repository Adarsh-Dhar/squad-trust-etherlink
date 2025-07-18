// POST /users
// Create user (signup or wallet connect)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User with this wallet address already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
} 