// POST, GET /teams/:teamId/projects
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import { getSigner, createSquadTrustService, ProjectCreationService } from '@/lib/contract';
import { squadtrust_address } from '@/lib/contract/address';

// Contract address - should be moved to environment variables
const CONTRACT_ADDRESS = process.env.SQUADTRUST_CONTRACT_ADDRESS || squadtrust_address;

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const data = await req.json();
    
    // Step 1: Validate required fields
    if (!data.title || !data.description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    if (!data.blockchainProjectId) {
      return NextResponse.json({ error: 'Blockchain project ID is required.' }, { status: 400 });
    }

    if (!data.walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 });
    }

    // Step 2: Validate wallet address format
    if (!ethers.isAddress(data.walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format.' }, { status: 400 });
    }

    // Step 3: Validate blockchain project ID
    const contractAddress = process.env.SQUADTRUST_CONTRACT_ADDRESS || squadtrust_address;
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      return NextResponse.json({ error: 'Server configuration error: Private key not found.' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const projectService = new ProjectCreationService(contractAddress, signer);

    // Validate the project exists on blockchain
    const validation = await projectService.validateProjectId(
      data.blockchainProjectId, 
      data.walletAddress
    );

    if (!validation.valid) {
      return NextResponse.json({ 
        error: `Invalid blockchain project: ${validation.error}` 
      }, { status: 400 });
    }

    // Step 4: Get team details and verify permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const isTeamMember = team.members.some(
      member => member.user.walletAddress.toLowerCase() === data.walletAddress.toLowerCase()
    );

    if (!isTeamMember) {
      return NextResponse.json({ error: 'Only team members can create projects.' }, { status: 403 });
    }

    // Step 5: Create project in database with validated blockchain data
    const project = await prisma.project.create({
      data: {
        name: data.title,
        description: data.description,
        githubRepo: data.githubRepo || null,
        liveUrl: data.liveUrl || null,
        status: 'HIRING',
        creator: data.walletAddress.toLowerCase(),
        teamId: teamId,
        blockchainProjectId: data.blockchainProjectId,
        minimumStake: parseFloat(data.minTeamStake || "0.1"),
        // Store additional blockchain data for verification
        blockchainData: {
          txHash: data.txHash,
          projectData: validation.projectData,
          createdAt: new Date().toISOString()
        }
      },
      include: {
        team: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...project,
      message: 'Project created successfully with validated blockchain data.',
      blockchainValidation: {
        valid: true,
        projectData: validation.projectData
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Project creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create project.',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const projects = await prisma.project.findMany({
      where: { teamId },
      include: {
        milestones: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        funding: true,
        roles: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
} 