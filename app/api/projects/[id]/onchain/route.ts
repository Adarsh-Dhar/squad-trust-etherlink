import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, txHash } = body;

    if (!projectId || !txHash) {
      return NextResponse.json({ error: 'Project ID and transaction hash are required' }, { status: 400 });
    }

    // Update the project with onchain data
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        contractProjectId: projectId,
        // You could also store the txHash in a separate field if needed
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        milestones: true,
        funding: true,
        roles: true,
      },
    });

    return NextResponse.json({
      ...updatedProject,
      transactionHash: txHash,
      message: 'Project updated with onchain data'
    });
  } catch (error) {
    console.error('Error updating project with onchain data:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
} 