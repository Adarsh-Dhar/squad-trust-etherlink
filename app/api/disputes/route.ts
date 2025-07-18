// POST /disputes
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const disputes = await prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(disputes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch disputes.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const dispute = await prisma.dispute.create({ data });
    return NextResponse.json(dispute);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit dispute.' }, { status: 500 });
  }
} 