// POST, GET /teams/:teamId/projects
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import { createSquadTrustService } from '@/lib/contract';

// Contract address - should be moved to environment variables
const CONTRACT_ADDRESS = process.env.SQUADTRUST_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const data = await req.json();
    
    // Validate required fields
    if (!data.title || !data.description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    // Check if wallet address is provided
    if (!data.walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required for blockchain project creation.' }, { status: 400 });
    }

    // Validate wallet address format
    if (!ethers.isAddress(data.walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format.' }, { status: 400 });
    }

    // Get team details to verify the user is a team member
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
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    // Check if the user is a team member
    const isTeamMember = team.members.some(
      member => member.user.walletAddress.toLowerCase() === data.walletAddress.toLowerCase()
    );

    if (!isTeamMember) {
      return NextResponse.json({ error: 'Only team members can create projects.' }, { status: 403 });
    }

    let blockchainProjectId: string;

    // Check if blockchain project ID is already provided (client-side creation)
    if (data.blockchainProjectId) {
      console.log('Using provided blockchain project ID:', data.blockchainProjectId);
      blockchainProjectId = data.blockchainProjectId;
    } else {
      // Fallback: Create project on blockchain server-side
      console.log('Creating project on blockchain server-side...');
      
      // Initialize blockchain connection
      let provider: ethers.Provider;
      let signer: ethers.Signer;
      let squadTrustService: any;

      try {
        // Server environment - use RPC URL
        const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
        provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // For server-side, we need a private key for signing transactions
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
          return NextResponse.json({ error: 'Server configuration error: Private key not found.' }, { status: 500 });
        }
        signer = new ethers.Wallet(privateKey, provider);

        // Create SquadTrust service
        squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);

        // Create project on blockchain
        const requiredConfirmations = data.requiredConfirmations || 2; // Default to 2 confirmations
        blockchainProjectId = await squadTrustService.createProject(data.title, requiredConfirmations);

      } catch (blockchainError: any) {
        console.error('Blockchain error:', blockchainError);
        
        // If blockchain creation fails, don't create in database
        return NextResponse.json({ 
          error: 'Failed to create project on blockchain. Please try again.',
          details: blockchainError.message 
        }, { status: 500 });
      }
    }

    // Create project in database with blockchain reference
    // Remove walletAddress, requiredConfirmations, and blockchainProjectId from data as they're not fields in the Project model
    const { walletAddress, requiredConfirmations, blockchainProjectId: _, ...projectData } = data;
    
    const project = await prisma.project.create({
      data: {
        ...projectData,
        teamId,
        blockchainProjectId: blockchainProjectId, // Store the blockchain project ID
        status: 'ONGOING',
      },
    });

    return NextResponse.json({
      ...project,
      blockchainProjectId,
      message: 'Project created successfully in database.'
    });

  } catch (error: any) {
    console.error('Project creation error:', error);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const projects = await prisma.project.findMany({
      where: { teamId },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
} 