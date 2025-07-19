import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createTaskSignatureMessage,
  generateNonce,
  verifySignature,
  verifyMultipleSignatures,
  hasEnoughSignatures,
  validateSignatureUniqueness,
  createSignatureReport,
  type SignatureData,
} from '@/lib/proof/signature';

// GET /milestones/:id/signatures - Get signature status for a task
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get milestone with project, team and signatures
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
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
          },
        },
        signatures: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Get team members' wallet addresses
    const teamMembers = milestone.project.team.members.map(member => member.user.walletAddress);
    const totalMembers = teamMembers.length;

    if (!milestone.signatures) {
      // No signatures yet, return initial state
      return NextResponse.json({
        milestoneId: id,
        projectId: milestone.projectId,
        teamId: milestone.project.teamId,
        totalMembers,
        requiredSignatures: Math.ceil(totalMembers * 0.5),
        signatures: [],
        status: 'PENDING',
        percentageComplete: 0,
        isApproved: false,
      });
    }

    const signatures = milestone.signatures.signatures as SignatureData[];
    const report = createSignatureReport(signatures, teamMembers, totalMembers);

    return NextResponse.json({
      milestoneId: id,
      projectId: milestone.projectId,
      teamId: milestone.project.teamId,
      totalMembers,
      requiredSignatures: report.summary.requiredSignatures,
      signatures: report.details.validSignatures,
      status: report.summary.isApproved ? 'APPROVED' : 'PENDING',
      percentageComplete: report.summary.percentageComplete,
      isApproved: report.summary.isApproved,
      missingSignatures: report.details.missingSignatures,
    });

  } catch (error) {
    console.error('Error fetching milestone signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}

// POST /milestones/:id/signatures - Sign a task
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { walletAddress, signature, message } = await req.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, signature, message' },
        { status: 400 }
      );
    }

    // Get milestone with project, team and signatures
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
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
          },
        },
        signatures: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Check if user is a team member
    const isTeamMember = milestone.project.team.members.some(
      member => member.user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!isTeamMember) {
      return NextResponse.json({ error: 'Only team members can sign tasks' }, { status: 403 });
    }

    // Verify signature
    const verification = verifySignature(message, signature, walletAddress);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get existing signatures or create new signature record
    let existingSignatures: SignatureData[] = [];
    let signatureRecord = milestone.signatures;

    if (signatureRecord) {
      existingSignatures = signatureRecord.signatures as SignatureData[];
    }

    // Create new signature data
    const newSignature: SignatureData = {
      signer: walletAddress.toLowerCase(),
      signature,
      message,
      timestamp: Date.now(),
      nonce: generateNonce(),
    };

    // Validate signature uniqueness
    if (!validateSignatureUniqueness(newSignature, existingSignatures)) {
      return NextResponse.json({ error: 'Signature already exists or signer has already signed' }, { status: 400 });
    }

    // Add new signature
    const updatedSignatures = [...existingSignatures, newSignature];
    const teamMembers = milestone.project.team.members.map(member => member.user.walletAddress);
    const totalMembers = teamMembers.length;
    const requiredSignatures = Math.ceil(totalMembers * 0.5);

    // Check if we have enough signatures
    const hasEnough = hasEnoughSignatures(updatedSignatures, totalMembers);
    const status = hasEnough ? 'APPROVED' : 'PENDING';

    // Update or create signature record
    if (signatureRecord) {
      await prisma.taskSignature.update({
        where: { milestoneId: id },
        data: {
          signatures: updatedSignatures,
          status,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.taskSignature.create({
        data: {
          milestoneId: id,
          projectId: milestone.projectId,
          teamId: milestone.project.teamId,
          signatures: updatedSignatures,
          requiredSignatures,
          totalMembers,
          status,
        },
      });
    }

    // If approved, update milestone status
    if (hasEnough) {
      await prisma.milestone.update({
        where: { id },
        data: { 
          completed: true,
          status: 'ACHIEVED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasEnough ? 'Task approved by team!' : 'Signature added successfully',
      totalSignatures: updatedSignatures.length,
      requiredSignatures,
      isApproved: hasEnough,
    });

  } catch (error) {
    console.error('Error signing milestone:', error);
    return NextResponse.json({ error: 'Failed to sign task' }, { status: 500 });
  }
}

// DELETE /milestones/:id/signatures - Remove a signature (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    // Get milestone with signatures
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        signatures: true,
      },
    });

    if (!milestone || !milestone.signatures) {
      return NextResponse.json({ error: 'Milestone or signatures not found' }, { status: 404 });
    }

    const signatures = milestone.signatures.signatures as SignatureData[];
    const updatedSignatures = signatures.filter(
      sig => sig.signer.toLowerCase() !== walletAddress.toLowerCase()
    );

    // Update signature record
    await prisma.taskSignature.update({
      where: { milestoneId: id },
      data: {
        signatures: updatedSignatures,
        status: 'PENDING', // Reset to pending since we removed a signature
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Signature removed successfully',
      totalSignatures: updatedSignatures.length,
    });

  } catch (error) {
    console.error('Error removing signature:', error);
    return NextResponse.json({ error: 'Failed to remove signature' }, { status: 500 });
  }
} 