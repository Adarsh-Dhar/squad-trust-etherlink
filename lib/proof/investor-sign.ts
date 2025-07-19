import { ethers } from 'ethers';
import { createHash } from 'crypto';

export interface InvestorSignatureData {
  signer: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
  amount: number;
  currency: string;
}

export interface InvestorSignature {
  id: string;
  projectId: string;
  fundingId: string;
  investorAddress: string;
  signatures: InvestorSignatureData[];
  requiredSignatures: number;
  totalInvestors: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestorSignatureVerificationResult {
  isValid: boolean;
  recoveredAddress: string;
  error?: string;
}

/**
 * Creates a message to be signed for investor payment approval
 */
export function createInvestorPaymentMessage(
  projectId: string,
  fundingId: string,
  projectTitle: string,
  amount: number,
  currency: string,
  nonce: string
): string {
  const timestamp = Date.now();
  return `SquadTrust Investor Payment Approval

Project ID: ${projectId}
Funding ID: ${fundingId}
Project Title: ${projectTitle}
Amount: ${amount} ${currency}
Nonce: ${nonce}
Timestamp: ${timestamp}

I approve this payment for project funding.

By signing this message, I confirm that:
1. I am an authorized investor for this project
2. I have reviewed the project deliverables and milestones
3. I approve the payment of ${amount} ${currency} for this project
4. This signature is valid only for this specific payment and timestamp
5. I understand this payment will be processed upon signature approval`;
}

/**
 * Creates a message to be signed for milestone payment approval
 */
export function createMilestonePaymentMessage(
  projectId: string,
  milestoneId: string,
  projectTitle: string,
  milestoneTitle: string,
  amount: number,
  currency: string,
  nonce: string
): string {
  const timestamp = Date.now();
  return `SquadTrust Milestone Payment Approval

Project ID: ${projectId}
Milestone ID: ${milestoneId}
Project Title: ${projectTitle}
Milestone Title: ${milestoneTitle}
Amount: ${amount} ${currency}
Nonce: ${nonce}
Timestamp: ${timestamp}

I approve this payment for milestone completion.

By signing this message, I confirm that:
1. I am an authorized investor for this project
2. I have reviewed the milestone completion criteria
3. I approve the payment of ${amount} ${currency} for this milestone
4. This signature is valid only for this specific milestone payment and timestamp
5. I understand this payment will be processed upon signature approval`;
}

/**
 * Generates a unique nonce for investor signature messages
 */
export function generateInvestorNonce(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Verifies an investor cryptographic signature
 */
export function verifyInvestorSignature(
  message: string,
  signature: string,
  expectedAddress: string
): InvestorSignatureVerificationResult {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    return {
      isValid: recoveredAddress.toLowerCase() === expectedAddress.toLowerCase(),
      recoveredAddress: recoveredAddress.toLowerCase(),
    };
  } catch (error) {
    return {
      isValid: false,
      recoveredAddress: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verifies multiple investor signatures for a payment
 */
export function verifyMultipleInvestorSignatures(
  signatures: InvestorSignatureData[],
  authorizedInvestors: string[]
): {
  validSignatures: InvestorSignatureData[];
  invalidSignatures: InvestorSignatureData[];
  totalValid: number;
  totalInvalid: number;
} {
  const validSignatures: InvestorSignatureData[] = [];
  const invalidSignatures: InvestorSignatureData[] = [];

  for (const signature of signatures) {
    const verification = verifyInvestorSignature(
      signature.message,
      signature.signature,
      signature.signer
    );

    if (verification.isValid && authorizedInvestors.includes(signature.signer.toLowerCase())) {
      validSignatures.push(signature);
    } else {
      invalidSignatures.push(signature);
    }
  }

  return {
    validSignatures,
    invalidSignatures,
    totalValid: validSignatures.length,
    totalInvalid: invalidSignatures.length,
  };
}

/**
 * Checks if a payment has enough investor signatures to be approved (>50% of investors)
 */
export function hasEnoughInvestorSignatures(
  validSignatures: InvestorSignatureData[],
  totalInvestors: number
): boolean {
  const requiredSignatures = Math.ceil(totalInvestors * 0.5); // More than 50%
  return validSignatures.length >= requiredSignatures;
}

/**
 * Calculates investor signature statistics for a payment
 */
export function calculateInvestorSignatureStats(
  signatures: InvestorSignatureData[],
  totalInvestors: number
): {
  totalSignatures: number;
  validSignatures: number;
  requiredSignatures: number;
  percentageComplete: number;
  isApproved: boolean;
} {
  const requiredSignatures = Math.ceil(totalInvestors * 0.5);
  const validSignatures = signatures.length; // Assuming all signatures are pre-validated
  const percentageComplete = totalInvestors > 0 ? (validSignatures / totalInvestors) * 100 : 0;
  const isApproved = validSignatures >= requiredSignatures;

  return {
    totalSignatures: signatures.length,
    validSignatures,
    requiredSignatures,
    percentageComplete,
    isApproved,
  };
}

/**
 * Creates a hash of the payment data for verification
 */
export function createPaymentHash(
  projectId: string,
  fundingId: string,
  amount: number,
  currency: string,
  paymentType: 'project' | 'milestone'
): string {
  const data = {
    projectId,
    fundingId,
    amount,
    currency,
    paymentType,
    timestamp: Date.now(),
  };
  
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Validates that an investor signature is unique and not a duplicate
 */
export function validateInvestorSignatureUniqueness(
  newSignature: InvestorSignatureData,
  existingSignatures: InvestorSignatureData[]
): boolean {
  // Check for duplicate signatures
  const isDuplicateSignature = existingSignatures.some(
    existing => existing.signature === newSignature.signature
  );

  if (isDuplicateSignature) {
    return false;
  }

  // Check if this investor has already signed
  const hasAlreadySigned = existingSignatures.some(
    existing => existing.signer.toLowerCase() === newSignature.signer.toLowerCase()
  );

  if (hasAlreadySigned) {
    return false;
  }

  // Check for replay attacks using nonce
  const isReplayAttack = existingSignatures.some(
    existing => existing.nonce === newSignature.nonce
  );

  if (isReplayAttack) {
    return false;
  }

  return true;
}

/**
 * Creates a comprehensive signature report for investor payments
 */
export function createInvestorSignatureReport(
  signatures: InvestorSignatureData[],
  authorizedInvestors: string[],
  totalInvestors: number
): {
  summary: {
    totalSignatures: number;
    validSignatures: number;
    requiredSignatures: number;
    percentageComplete: number;
    isApproved: boolean;
  };
  details: {
    validSignatures: InvestorSignatureData[];
    invalidSignatures: InvestorSignatureData[];
    missingSignatures: string[];
  };
} {
  const { validSignatures, invalidSignatures } = verifyMultipleInvestorSignatures(
    signatures,
    authorizedInvestors
  );

  const requiredSignatures = Math.ceil(totalInvestors * 0.5);
  const percentageComplete = totalInvestors > 0 ? (validSignatures.length / totalInvestors) * 100 : 0;
  const isApproved = validSignatures.length >= requiredSignatures;

  // Find missing signatures
  const signedAddresses = validSignatures.map(sig => sig.signer.toLowerCase());
  const missingSignatures = authorizedInvestors.filter(
    investor => !signedAddresses.includes(investor.toLowerCase())
  );

  return {
    summary: {
      totalSignatures: signatures.length,
      validSignatures: validSignatures.length,
      requiredSignatures,
      percentageComplete,
      isApproved,
    },
    details: {
      validSignatures,
      invalidSignatures,
      missingSignatures,
    },
  };
}

/**
 * Validates payment amount and currency
 */
export function validatePaymentAmount(
  amount: number,
  currency: string
): { isValid: boolean; error?: string } {
  if (amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than 0' };
  }

  if (!currency || currency.trim() === '') {
    return { isValid: false, error: 'Currency is required' };
  }

  // Add more validation as needed (e.g., supported currencies)
  const supportedCurrencies = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH'];
  if (!supportedCurrencies.includes(currency.toUpperCase())) {
    return { isValid: false, error: `Unsupported currency: ${currency}` };
  }

  return { isValid: true };
}
