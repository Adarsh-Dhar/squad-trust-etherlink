import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createInvestorPaymentMessage,
  generateInvestorNonce,
  verifyInvestorSignature,
  verifyMultipleInvestorSignatures,
  hasEnoughInvestorSignatures,
  validateInvestorSignatureUniqueness,
  createInvestorSignatureReport,
  validatePaymentAmount,
  type InvestorSignatureData,
} from '@/lib/proof/investor-sign';

// GET /projects/:id/funding/:fundingId/investor-signatures - Get investor signature status for a funding payment
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; fundingId: string }> }
) {
  try {
    const { id, fundingId } = await params;
    
    // Get funding with project and investor signatures
    const funding = await prisma.funding.findUnique({
      where: { id: fundingId },
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

    if (!funding) {
      return NextResponse.json({ error: 'Funding not found' }, { status: 404 });
    }

    if (funding.projectId !== id) {
      return NextResponse.json({ error: 'Funding does not belong to this project' }, { status: 400 });
    }

    // For now, we'll use team members as authorized investors
    // In a real implementation, you'd have a separate investor list
    const authorizedInvestors = funding.project.team.members.map(member => member.user.walletAddress);
    const totalInvestors = authorizedInvestors.length;

    if (!funding.investorSignatures) {
      // No signatures yet, return initial state
      return NextResponse.json({
        fundingId,
        projectId: id,
        totalInvestors,
        requiredSignatures: Math.ceil(totalInvestors * 0.5),
        signatures: [],
        status: 'PENDING',
        percentageComplete: 0,
        isApproved: false,
        amount: funding.amount,
        currency: funding.currency,
      });
    }

    const signatures = funding.investorSignatures.signatures as InvestorSignatureData[];
    const report = createInvestorSignatureReport(signatures, authorizedInvestors, totalInvestors);

    return NextResponse.json({
      fundingId,
      projectId: id,
      totalInvestors,
      requiredSignatures: report.summary.requiredSignatures,
      signatures: signatures,
      status: funding.investorSignatures.status,
      percentageComplete: report.summary.percentageComplete,
      isApproved: report.summary.isApproved,
      amount: funding.amount,
      currency: funding.currency,
      missingSignatures: report.details.missingSignatures,
    });

  } catch (error) {
    console.error('Error fetching investor signature status:', error);
    return NextResponse.json({ error: 'Failed to fetch investor signature status' }, { status: 500 });
  }
}

// POST /projects/:id/funding/:fundingId/investor-signatures - Sign a funding payment as an investor
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; fundingId: string }> }
) {
  try {
    const { id, fundingId } = await params;
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

    // Get funding with project and investor signatures
    const funding = await prisma.funding.findUnique({
      where: { id: fundingId },
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

    if (!funding) {
      return NextResponse.json({ error: 'Funding not found' }, { status: 404 });
    }

    if (funding.projectId !== id) {
      return NextResponse.json({ error: 'Funding does not belong to this project' }, { status: 400 });
    }

    // For now, we'll use team members as authorized investors
    // In a real implementation, you'd have a separate investor list
    const authorizedInvestors = funding.project.team.members.map(member => member.user.walletAddress);
    const isAuthorizedInvestor = authorizedInvestors.some(
      investor => investor.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!isAuthorizedInvestor) {
      return NextResponse.json({ error: 'Only authorized investors can sign payments' }, { status: 403 });
    }

    // Verify signature
    const verification = verifyInvestorSignature(message, signature, walletAddress);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get existing signatures or create new signature record
    let existingSignatures: InvestorSignatureData[] = [];
    let signatureRecord = funding.investorSignatures;

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
      await prisma.investorSignature.update({
        where: { fundingId },
        data: {
          signatures: updatedSignatures,
          status,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.investorSignature.create({
        data: {
          projectId: id,
          fundingId,
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

    // If approved, you could trigger payment processing here
    if (hasEnough) {
      // Update funding status or trigger payment
      await prisma.funding.update({
        where: { id: fundingId },
        data: {
          // Add any payment processing fields
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: hasEnough ? 'Payment approved by investors!' : 'Signature added successfully',
      totalSignatures: updatedSignatures.length,
      requiredSignatures,
      isApproved: hasEnough,
      amount,
      currency,
    });

  } catch (error) {
    console.error('Error signing funding payment:', error);
    return NextResponse.json({ error: 'Failed to sign funding payment' }, { status: 500 });
  }
} 