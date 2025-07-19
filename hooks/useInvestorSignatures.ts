import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  createInvestorPaymentMessage,
  createMilestonePaymentMessage,
  generateInvestorNonce,
  type InvestorSignatureData,
} from '@/lib/proof/investor-sign';

interface InvestorSignatureStatus {
  fundingId?: string;
  milestoneId?: string;
  projectId: string;
  totalInvestors: number;
  requiredSignatures: number;
  signatures: InvestorSignatureData[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  percentageComplete: number;
  isApproved: boolean;
  amount: number;
  currency: string;
  missingSignatures?: string[];
}

interface UseInvestorSignaturesOptions {
  type: 'project' | 'milestone';
  id: string;
  title: string;
  projectId: string;
  amount: number;
  currency: string;
}

export function useInvestorSignatures({ type, id, title, projectId, amount, currency }: UseInvestorSignaturesOptions) {
  const { data: session } = useSession();
  const [signatureStatus, setSignatureStatus] = useState<InvestorSignatureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userWalletAddress = session?.user?.walletAddress;

  const fetchSignatureStatus = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = type === 'project' 
        ? `/api/projects/${projectId}/funding/${id}/investor-signatures`
        : `/api/milestones/${id}/investor-signatures`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch investor signature status');
      
      const data = await response.json();
      setSignatureStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch investor signature status');
    } finally {
      setLoading(false);
    }
  }, [type, id, projectId]);

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
      const nonce = generateInvestorNonce();
      const message = type === 'project'
        ? createInvestorPaymentMessage(projectId, id, title, amount, currency, nonce)
        : createMilestonePaymentMessage(projectId, id, title, title, amount, currency, nonce);

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Submit signature to API
      const endpoint = type === 'project' 
        ? `/api/projects/${projectId}/funding/${id}/investor-signatures`
        : `/api/milestones/${id}/investor-signatures`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          amount,
          currency,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit investor signature');
      }

      toast.success(result.message);
      await fetchSignatureStatus(); // Refresh status
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign payment';
      toast.error(errorMessage);
      throw err;
    } finally {
      setSigning(false);
    }
  }, [type, id, title, projectId, amount, currency, userWalletAddress, fetchSignatureStatus]);

  const canSign = userWalletAddress && signatureStatus && !signatureStatus.isApproved;

  return {
    signatureStatus,
    loading,
    signing,
    error,
    signWithWallet,
    canSign,
    isApproved: signatureStatus?.isApproved || false,
    fetchSignatureStatus,
  };
} 