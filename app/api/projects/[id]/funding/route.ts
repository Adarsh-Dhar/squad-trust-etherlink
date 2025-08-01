// POST, GET /projects/:projectId/funding
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSigner, createSquadTrustService } from '@/lib/contract';
import { squadtrust_address } from '@/lib/contract/address';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const funding = await prisma.funding.create({
      data: {
        ...data,
        projectId: id,
      },
    });

    // Onchain confirmMilestone call (optional, only if wallet/signer is available)
    let onchainTx = null;
    let onchainError = null;
    try {
      const signer = await getSigner();
      if (signer) {
        const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || squadtrust_address;
        const squadTrustService = createSquadTrustService(contractAddress, signer);
        // TODO: Implement confirmMilestone when contract supports it
        // await squadTrustService.confirmMilestone(id, Number(funding.id), data.description || "Funding confirmed");
        onchainTx = false; // Set to false since method is not implemented
        onchainError = "confirmMilestone method not yet implemented in the smart contract";
      }
    } catch (err) {
      onchainError = err instanceof Error ? err.message : String(err);
      // Don't throw, just log
      console.error('Onchain confirmMilestone failed:', onchainError);
    }

    return NextResponse.json({ ...funding, onchainTx, onchainError });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log funding.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const funding = await prisma.funding.findMany({
      where: { projectId: id },
    });
    return NextResponse.json(funding);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch funding.' }, { status: 500 });
  }
} 