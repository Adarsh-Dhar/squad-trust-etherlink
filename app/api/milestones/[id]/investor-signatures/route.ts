import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createMilestonePaymentMessage,
  generateInvestorNonce,
  verifyInvestorSignature,
  verifyMultipleInvestorSignatures,
  hasEnoughInvestorSignatures,
  validateInvestorSignatureUniqueness,
  createInvestorSignatureReport,
  validatePaymentAmount,
  type InvestorSignatureData,
} from '@/lib/proof/investor-sign';

// GET /milestones/:id/investor-signatures - Get investor signature status for a milestone payment
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get milestone with project and investor signatures
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
        investorSignatures: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // For now, we'll use team members as authorized investors
    // In a real implementation, you'd have a separate investor list
    const authorizedInvestors = milestone.project.team.members.map(member => member.user.walletAddress);
    const totalInvestors = authorizedInvestors.length;

    if (!milestone.investorSignatures) {
      // No signatures yet, return initial state
      return NextResponse.json({
        milestoneId: id,
        projectId: milestone.projectId,
        totalInvestors,
        requiredSignatures: Math.ceil(totalInvestors * 0.5),
        signatures: [],
        status: 'PENDING',
        percentageComplete: 0,
        isApproved: false,
        amount: milestone.stakedAmount || 0,
        currency: milestone.stakeCurrency || 'ETH',
      });
    }

    const signatures = milestone.investorSignatures.signatures as InvestorSignatureData[];
    const report = createInvestorSignatureReport(signatures, authorizedInvestors, totalInvestors);

    return NextResponse.json({
      milestoneId: id,
      projectId: milestone.projectId,
      totalInvestors,
      requiredSignatures: report.summary.requiredSignatures,
      signatures: signatures,
      status: milestone.investorSignatures.status,
      percentageComplete: report.summary.percentageComplete,
      isApproved: report.summary.isApproved,
      amount: milestone.investorSignatures.amount,
      currency: milestone.investorSignatures.currency,
      missingSignatures: report.details.missingSignatures,
    });

  } catch (error) {
    console.error('Error fetching milestone investor signature status:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone investor signature status' }, { status: 500 });
  }
}

// POST /milestones/:id/investor-signatures - Sign a milestone payment as an investor
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { walletAddress, signature, message, amount, currency } = await req.json();

    if (!walletAddress || !signature || !message || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, signature, message, amount, currency' },
        { status: 400 }
      );
    }

    // Validate payment amount
    const amountValidation = validatePaymentAmount(amount, currency);
    if (!amountValidation.isValid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }

    // Get milestone with project and investor signatures
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
        investorSignatures: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // For now, we'll use team members as authorized investors
    // In a real implementation, you'd have a separate investor list
    const authorizedInvestors = milestone.project.team.members.map(member => member.user.walletAddress);
    const isAuthorizedInvestor = authorizedInvestors.some(
      investor => investor.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!isAuthorizedInvestor) {
      return NextResponse.json({ error: 'Only authorized investors can sign milestone payments' }, { status: 403 });
    }

    // Verify signature
    const verification = verifyInvestorSignature(message, signature, walletAddress);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get existing signatures or create new signature record
    let existingSignatures: InvestorSignatureData[] = [];
    let signatureRecord = milestone.investorSignatures;

    if (signatureRecord) {
      existingSignatures = signatureRecord.signatures as InvestorSignatureData[];
    }

    // Create new signature data
    const newSignature: InvestorSignatureData = {
      signer: walletAddress.toLowerCase(),
      signature,
      message,
      timestamp: Date.now(),
      nonce: generateInvestorNonce(),
      amount,
      currency,
    };

    // Validate signature uniqueness
    if (!validateInvestorSignatureUniqueness(newSignature, existingSignatures)) {
      return NextResponse.json({ error: 'Signature already exists or investor has already signed' }, { status: 400 });
    }

    // Add new signature
    const updatedSignatures = [...existingSignatures, newSignature];
    const totalInvestors = authorizedInvestors.length;
    const requiredSignatures = Math.ceil(totalInvestors * 0.5);

    // Check if we have enough signatures
    const hasEnough = hasEnoughInvestorSignatures(updatedSignatures, totalInvestors);
    const status = hasEnough ? 'APPROVED' : 'PENDING';

    // Update or create signature record
    if (signatureRecord) {
      await prisma.milestoneInvestorSignature.update({
        where: { milestoneId: id },
        data: {
          signatures: updatedSignatures,
          status,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.milestoneInvestorSignature.create({
        data: {
          milestoneId: id,
          projectId: milestone.projectId,
          investorAddress: walletAddress.toLowerCase(),
          signatures: updatedSignatures,
          requiredSignatures,
          totalInvestors,
          status,
          amount,
          currency,
        },
      });
    }

    // If approved, update milestone status and trigger payment
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
      message: hasEnough ? 'Milestone payment approved by investors!' : 'Signature added successfully',
      totalSignatures: updatedSignatures.length,
      requiredSignatures,
      isApproved: hasEnough,
      amount,
      currency,
    });

  } catch (error) {
    console.error('Error signing milestone payment:', error);
    return NextResponse.json({ error: 'Failed to sign milestone payment' }, { status: 500 });
  }
} 