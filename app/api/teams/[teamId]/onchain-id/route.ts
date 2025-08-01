import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSquadTrustService, getSigner } from '@/lib/contract';
import { squadtrust_address } from '@/lib/contract/address';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is team admin
    const isAdmin = team.members.some(
      member => 
        member.user.walletAddress.toLowerCase() === session.user.walletAddress.toLowerCase() &&
        member.role === 'ADMIN'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only team admins can create on-chain team' }, { status: 403 });
    }

    // If team already has onchainTeamId, return it
    if (team.onchainTeamId) {
      return NextResponse.json({ 
        onchainTeamId: team.onchainTeamId,
        message: 'Team already has on-chain ID'
      });
    }

    // Get signer for on-chain transaction
    const signer = await getSigner();
    if (!signer) {
      return NextResponse.json({ error: 'Failed to get wallet signer' }, { status: 500 });
    }

    const squadTrustService = createSquadTrustService(squadtrust_address, signer);

    // Get team member addresses
    const memberAddresses = team.members.map(member => member.user.walletAddress);

    // Create team on-chain
    console.log('Creating team on-chain:', {
      name: team.name,
      members: memberAddresses
    });

    const { teamId: onchainTeamId, txHash } = await squadTrustService.createTeam(
      team.name,
      memberAddresses
    );

    console.log('✅ Team created on-chain:', { onchainTeamId, txHash });

    // Update team in database with on-chain ID
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { onchainTeamId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      onchainTeamId,
      txHash,
      team: updatedTeam,
      message: 'Team successfully created on-chain'
    });

  } catch (error) {
    console.error('Error creating team on-chain:', error);
    return NextResponse.json({ 
      error: 'Failed to create team on-chain',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 