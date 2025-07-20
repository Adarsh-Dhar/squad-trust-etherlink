import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    contractAddress: process.env.SQUADTRUST_CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY ? 'SET' : 'NOT_SET',
    rpcUrl: process.env.RPC_URL,
  });
} 