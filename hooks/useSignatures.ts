import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  createProjectSignatureMessage,
  createTaskSignatureMessage,
  generateNonce,
  type SignatureData,
} from '@/lib/proof/signature';

interface SignatureStatus {
  projectId?: string;
  milestoneId?: string;
  teamId: string;
  totalMembers: number;
  requiredSignatures: number;
  signatures: SignatureData[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  percentageComplete: number;
  isApproved: boolean;
  missingSignatures?: string[];
}

interface UseSignaturesOptions {
  type: 'project' | 'task';
  id: string;
  title: string;
  teamId: string;
}

export function useSignatures({ type, id, title, teamId }: UseSignaturesOptions) {
  const { data: session } = useSession();
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);

  const userWalletAddress = session?.user?.walletAddress;

  const fetchSignatureStatus = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = type === 'project' 
        ? `/api/projects/${id}/signatures`
        : `/api/milestones/${id}/signatures`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch signature status');
      
      const data = await response.json();
      setSignatureStatus(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch signature status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  const signWithWallet = useCallback(async () => {
    if (!userWalletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setSigning(true);

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      if (!address) {
        throw new Error('No wallet address found.');
      }

      // Create signature message
      const nonce = generateNonce();
      const message = type === 'project'
        ? createProjectSignatureMessage(id, teamId, title, nonce)
        : createTaskSignatureMessage(id, id, teamId, title, nonce);

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Submit signature to API
      const endpoint = type === 'project' 
        ? `/api/projects/${id}/signatures`
        : `/api/milestones/${id}/signatures`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit signature');
      }

      toast.success(result.message);
      await fetchSignatureStatus(); // Refresh status
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign';
      toast.error(errorMessage);
      throw err;
    } finally {
      setSigning(false);
    }
  }, [type, id, title, teamId, userWalletAddress, fetchSignatureStatus]);

  const hasUserSigned = signatureStatus?.signatures.some(
    sig => sig.signer.toLowerCase() === userWalletAddress?.toLowerCase()
  );

  const canSign = userWalletAddress && !hasUserSigned && signatureStatus?.status === 'PENDING';

  const isApproved = signatureStatus?.isApproved || false;
  const percentageComplete = signatureStatus?.percentageComplete || 0;
  const totalSignatures = signatureStatus?.signatures.length || 0;
  const requiredSignatures = signatureStatus?.requiredSignatures || 0;

  return {
    // State
    signatureStatus,
    loading,
    signing,
    userWalletAddress,
    
    // Computed values
    hasUserSigned,
    canSign,
    isApproved,
    percentageComplete,
    totalSignatures,
    requiredSignatures,
    
    // Actions
    fetchSignatureStatus,
    signWithWallet,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
} 