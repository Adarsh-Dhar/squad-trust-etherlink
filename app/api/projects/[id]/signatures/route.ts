import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createProjectSignatureMessage,
  generateNonce,
  verifySignature,
  verifyMultipleSignatures,
  hasEnoughSignatures,
  validateSignatureUniqueness,
  createSignatureReport,
  type SignatureData,
} from '@/lib/proof/signature';

// GET /projects/:id/signatures - Get signature status for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get project with team and signatures
    const project = await prisma.project.findUnique({
      where: { id },
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
        signatures: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get team members' wallet addresses
    const teamMembers = project.team?.members.map(member => member.user.walletAddress) || [];
    const totalMembers = teamMembers.length;

    if (!project.signatures) {
      // No signatures yet, return initial state
      return NextResponse.json({
        projectId: id,
        teamId: project.teamId,
        totalMembers,
        requiredSignatures: Math.ceil(totalMembers * 0.5),
        signatures: [],
        status: 'PENDING',
        percentageComplete: 0,
        isApproved: false,
      });
    }

    const signatures = (project.signatures.signatures as any) || [];
    const report = createSignatureReport(signatures, teamMembers, totalMembers);

    return NextResponse.json({
      projectId: id,
      teamId: project.teamId,
      totalMembers,
      requiredSignatures: report.summary.requiredSignatures,
      signatures: report.details.validSignatures,
      status: report.summary.isApproved ? 'APPROVED' : 'PENDING',
      percentageComplete: report.summary.percentageComplete,
      isApproved: report.summary.isApproved,
      missingSignatures: report.details.missingSignatures,
    });

  } catch (error) {
    console.error('Error fetching project signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}

// POST /projects/:id/signatures - Sign a project
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

    // Get project with team and signatures
    const project = await prisma.project.findUnique({
      where: { id },
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
        signatures: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is a team member
    const isTeamMember = project.team?.members.some(
      member => member.user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    ) || false;

    if (!isTeamMember) {
      return NextResponse.json({ error: 'Only team members can sign projects' }, { status: 403 });
    }

    // Verify signature
    const verification = verifySignature(message, signature, walletAddress);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get existing signatures or create new signature record
    let existingSignatures: SignatureData[] = [];
    let signatureRecord = project.signatures?.[0];

    if (signatureRecord) {
      existingSignatures = (signatureRecord.signatures as any) || [];
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
    const teamMembers = project.team?.members.map(member => member.user.walletAddress) || [];
    const totalMembers = teamMembers.length;
    const requiredSignatures = Math.ceil(totalMembers * 0.5);

    // Check if we have enough signatures
    const hasEnough = hasEnoughSignatures(updatedSignatures, totalMembers);
    const status = hasEnough ? 'APPROVED' : 'PENDING';

    // Update or create signature record
    if (signatureRecord) {
      await prisma.projectSignature.update({
        where: { projectId: id },
        data: {
          signatures: JSON.stringify(updatedSignatures),
          status,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.projectSignature.create({
        data: {
          projectId: id,
          teamId: project.teamId || '',
          signatures: JSON.stringify(updatedSignatures),
          requiredSignatures,
          totalMembers,
          status,
        },
      });
    }

    // If approved, update project status
    if (hasEnough) {
      await prisma.project.update({
        where: { id },
        data: { status: 'FINISHED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasEnough ? 'Project approved by team!' : 'Signature added successfully',
      totalSignatures: updatedSignatures.length,
      requiredSignatures,
      isApproved: hasEnough,
    });

  } catch (error) {
    console.error('Error signing project:', error);
    return NextResponse.json({ error: 'Failed to sign project' }, { status: 500 });
  }
}

// DELETE /projects/:id/signatures - Remove a signature (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    // Get project with signatures
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        signatures: true,
      },
    });

    if (!project || !project.signatures) {
      return NextResponse.json({ error: 'Project or signatures not found' }, { status: 404 });
    }

    const signatures = (project.signatures?.[0]?.signatures as any) || [];
    const updatedSignatures = signatures.filter(
      sig => sig.signer.toLowerCase() !== walletAddress.toLowerCase()
    );

    // Update signature record
    await prisma.projectSignature.update({
      where: { projectId: id },
      data: {
        signatures: JSON.stringify(updatedSignatures),
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