import { NextRequest, NextResponse } from 'next/server';
import { getTransactionData, isValidTransactionHash, SUPPORTED_CHAINS, type SupportedChainId } from '@/lib/proof/etherscan';

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;
    const searchParams = request.nextUrl.searchParams;
    const chainId = parseInt(searchParams.get('chainId') || '1') as SupportedChainId;

    // Validate transaction hash
    if (!isValidTransactionHash(hash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Validate chain ID
    if (!SUPPORTED_CHAINS[chainId]) {
      return NextResponse.json(
        { error: 'Unsupported chain ID' },
        { status: 400 }
      );
    }

    // Fetch transaction data
    const transactionData = await getTransactionData(hash, chainId);

    return NextResponse.json({
      success: true,
      data: transactionData,
      chainId,
      chainName: SUPPORTED_CHAINS[chainId],
    });

  } catch (error) {
    console.error('Error fetching transaction data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 