import { ethers } from 'ethers';
import { createHash } from 'crypto';

export interface SignatureData {
  signer: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
}

export interface ProjectSignature {
  id: string;
  projectId: string;
  teamId: string;
  signatures: SignatureData[];
  requiredSignatures: number;
  totalMembers: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSignature {
  id: string;
  taskId: string;
  projectId: string;
  teamId: string;
  signatures: SignatureData[];
  requiredSignatures: number;
  totalMembers: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  recoveredAddress: string;
  error?: string;
}

/**
 * Creates a message to be signed for project approval
 */
export function createProjectSignatureMessage(
  projectId: string,
  teamId: string,
  projectTitle: string,
  nonce: string
): string {
  const timestamp = Date.now();
  return `SquadTrust Project Approval

Project ID: ${projectId}
Team ID: ${teamId}
Project Title: ${projectTitle}
Nonce: ${nonce}
Timestamp: ${timestamp}

I approve this project for completion and delivery.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the project deliverables
3. I approve the project for completion
4. This signature is valid only for this specific project and timestamp`;
}

/**
 * Creates a message to be signed for task completion
 */
export function createTaskSignatureMessage(
  taskId: string,
  projectId: string,
  teamId: string,
  taskTitle: string,
  nonce: string
): string {
  const timestamp = Date.now();
  return `SquadTrust Task Completion

Task ID: ${taskId}
Project ID: ${projectId}
Team ID: ${teamId}
Task Title: ${taskTitle}
Nonce: ${nonce}
Timestamp: ${timestamp}

I confirm this task has been completed satisfactorily.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the task completion
3. I approve the task as completed
4. This signature is valid only for this specific task and timestamp`;
}

/**
 * Generates a unique nonce for signature messages
 */
export function generateNonce(): string {
  return createHash('sha256')
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Verifies a cryptographic signature
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): SignatureVerificationResult {
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
 * Verifies multiple signatures for a project or task
 */
export function verifyMultipleSignatures(
  signatures: SignatureData[],
  teamMembers: string[]
): {
  validSignatures: SignatureData[];
  invalidSignatures: SignatureData[];
  totalValid: number;
  totalInvalid: number;
} {
  const validSignatures: SignatureData[] = [];
  const invalidSignatures: SignatureData[] = [];

  for (const signature of signatures) {
    const verification = verifySignature(
      signature.message,
      signature.signature,
      signature.signer
    );

    if (verification.isValid && teamMembers.includes(signature.signer.toLowerCase())) {
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
 * Checks if a project/task has enough signatures to be approved (>50% of team members)
 */
export function hasEnoughSignatures(
  validSignatures: SignatureData[],
  totalTeamMembers: number
): boolean {
  const requiredSignatures = Math.ceil(totalTeamMembers * 0.5); // More than 50%
  return validSignatures.length >= requiredSignatures;
}

/**
 * Calculates signature statistics for a project or task
 */
export function calculateSignatureStats(
  signatures: SignatureData[],
  totalTeamMembers: number
): {
  totalSignatures: number;
  validSignatures: number;
  requiredSignatures: number;
  percentageComplete: number;
  isApproved: boolean;
} {
  const requiredSignatures = Math.ceil(totalTeamMembers * 0.5);
  const validSignatures = signatures.length; // Assuming all signatures are pre-validated
  const percentageComplete = totalTeamMembers > 0 ? (validSignatures / totalTeamMembers) * 100 : 0;
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
 * Creates a hash of the project data for verification
 */
export function createProjectHash(
  projectId: string,
  teamId: string,
  projectTitle: string,
  deliveryHash?: string
): string {
  const data = {
    projectId,
    teamId,
    projectTitle,
    deliveryHash: deliveryHash || '',
    timestamp: Date.now(),
  };
  
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Creates a hash of the task data for verification
 */
export function createTaskHash(
  taskId: string,
  projectId: string,
  teamId: string,
  taskTitle: string
): string {
  const data = {
    taskId,
    projectId,
    teamId,
    taskTitle,
    timestamp: Date.now(),
  };
  
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Validates that a signature hasn't been reused
 */
export function validateSignatureUniqueness(
  newSignature: SignatureData,
  existingSignatures: SignatureData[]
): boolean {
  // Check if this signer has already signed
  const existingSignature = existingSignatures.find(
    sig => sig.signer.toLowerCase() === newSignature.signer.toLowerCase()
  );
  
  if (existingSignature) {
    return false;
  }

  // Check if this exact signature has been used before
  const duplicateSignature = existingSignatures.find(
    sig => sig.signature === newSignature.signature
  );
  
  return !duplicateSignature;
}

/**
 * Creates a comprehensive signature report
 */
export function createSignatureReport(
  signatures: SignatureData[],
  teamMembers: string[],
  totalTeamMembers: number
): {
  summary: {
    totalSignatures: number;
    validSignatures: number;
    requiredSignatures: number;
    percentageComplete: number;
    isApproved: boolean;
  };
  details: {
    validSignatures: SignatureData[];
    invalidSignatures: SignatureData[];
    missingSignatures: string[];
  };
} {
  const verification = verifyMultipleSignatures(signatures, teamMembers);
  const stats = calculateSignatureStats(verification.validSignatures, totalTeamMembers);
  
  // Find team members who haven't signed yet
  const signedAddresses = verification.validSignatures.map(sig => sig.signer.toLowerCase());
  const missingSignatures = teamMembers.filter(
    member => !signedAddresses.includes(member.toLowerCase())
  );

  return {
    summary: stats,
    details: {
      validSignatures: verification.validSignatures,
      invalidSignatures: verification.invalidSignatures,
      missingSignatures,
    },
  };
}
