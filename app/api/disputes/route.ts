// GET /disputes and POST /disputes
import { NextRequest, NextResponse } from 'next/server';
import { disputeSystem } from '@/lib/dispute';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const disputes = await disputeSystem.getDisputes({
      status,
      limit,
      offset,
      includeExpired,
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('Get disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const dispute = await disputeSystem.createDispute(data);
    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Create dispute error:', error);
    return NextResponse.json({ error: 'Failed to submit dispute.' }, { status: 500 });
  }
} 