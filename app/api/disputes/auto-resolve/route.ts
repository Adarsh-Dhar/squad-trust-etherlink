import { NextRequest, NextResponse } from 'next/server';
import { disputeSystem } from '@/lib/dispute';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    let result;
    
    switch (action) {
      case 'resolve':
        result = await disputeSystem.autoResolveExpiredDisputes();
        break;
      case 'ignore':
        result = await disputeSystem.autoIgnoreExpiredDisputes();
        break;
      case 'both':
        const [resolveResult, ignoreResult] = await Promise.all([
          disputeSystem.autoResolveExpiredDisputes(),
          disputeSystem.autoIgnoreExpiredDisputes(),
        ]);
        result = {
          resolved: resolveResult.resolved,
          ignored: ignoreResult.ignored,
          message: `${resolveResult.message}. ${ignoreResult.message}`,
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "resolve", "ignore", or "both"' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Auto-resolve dispute error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-resolve disputes.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const stats = await disputeSystem.getDisputeStats();
    const expiringDisputes = await disputeSystem.getExpiringDisputes();
    const config = disputeSystem.getConfig();

    return NextResponse.json({
      stats,
      expiringDisputes,
      config,
    });
  } catch (error: any) {
    console.error('Get dispute stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get dispute statistics.' },
      { status: 500 }
    );
  }
} 