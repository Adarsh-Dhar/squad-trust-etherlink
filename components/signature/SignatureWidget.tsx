"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Shield, 
  AlertCircle,
  Loader2,
  Signature
} from 'lucide-react';
import { toast } from 'sonner';

interface SignatureData {
  signer: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
}

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

interface SignatureWidgetProps {
  type: 'project' | 'task';
  id: string;
  title: string;
  teamId: string;
  onStatusChange?: (status: 'PENDING' | 'APPROVED' | 'REJECTED') => void;
}

export function SignatureWidget({ type, id, title, teamId, onStatusChange }: SignatureWidgetProps) {
  const { data: session } = useSession();
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userWalletAddress = session?.user?.walletAddress;

  useEffect(() => {
    fetchSignatureStatus();
  }, [id]);

  const fetchSignatureStatus = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'project' 
        ? `/api/projects/${id}/signatures`
        : `/api/milestones/${id}/signatures`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch signature status');
      
      const data = await response.json();
      setSignatureStatus(data);
      onStatusChange?.(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signature status');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!userWalletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setSigning(true);
      setError(null);

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
      const nonce = Math.random().toString(36).substring(2, 15);
      const message = type === 'project'
        ? `SquadTrust Project Approval

Project ID: ${id}
Team ID: ${teamId}
Project Title: ${title}
Nonce: ${nonce}
Timestamp: ${Date.now()}

I approve this project for completion and delivery.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the project deliverables
3. I approve the project for completion
4. This signature is valid only for this specific project and timestamp`
        : `SquadTrust Task Completion

Task ID: ${id}
Team ID: ${teamId}
Task Title: ${title}
Nonce: ${nonce}
Timestamp: ${Date.now()}

I confirm this task has been completed satisfactorily.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the task completion
3. I approve the task as completed
4. This signature is valid only for this specific task and timestamp`;

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
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSigning(false);
    }
  };

  const hasUserSigned = signatureStatus?.signatures.some(
    sig => sig.signer.toLowerCase() === userWalletAddress?.toLowerCase()
  );

  const canSign = userWalletAddress && !hasUserSigned && signatureStatus?.status === 'PENDING';

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading signature status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!signatureStatus) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No signature data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Team Approval Required
        </CardTitle>
        <CardDescription>
          {type === 'project' ? 'Project completion' : 'Task completion'} requires approval from more than 50% of team members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={signatureStatus.isApproved ? "default" : "secondary"}
            className={signatureStatus.isApproved ? "bg-green-500" : ""}
          >
            {signatureStatus.isApproved ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {signatureStatus.isApproved ? 'Approved' : 'Pending Approval'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {signatureStatus.signatures.length} of {signatureStatus.requiredSignatures} required signatures
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Signature Progress</span>
            <span>{Math.round(signatureStatus.percentageComplete)}%</span>
          </div>
          <Progress value={signatureStatus.percentageComplete} className="h-2" />
        </div>

        {/* Team Members Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{signatureStatus.totalMembers} team members</span>
          <span>•</span>
          <span>{signatureStatus.requiredSignatures} signatures required</span>
        </div>

        {/* User Signature Status */}
        {userWalletAddress && (
          <div className="flex items-center gap-2">
            {hasUserSigned ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">You have signed this {type}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">You haven't signed yet</span>
              </div>
            )}
          </div>
        )}

        {/* Sign Button */}
        {canSign && (
          <Button 
            onClick={handleSign} 
            disabled={signing}
            className="w-full"
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Signature className="h-4 w-4 mr-2" />
                Sign with Wallet
              </>
            )}
          </Button>
        )}

        {/* Missing Signatures */}
        {signatureStatus.missingSignatures && signatureStatus.missingSignatures.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>Still waiting for signatures from:</p>
            <div className="mt-1 space-y-1">
              {signatureStatus.missingSignatures.map((address, index) => (
                <div key={index} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {signatureStatus.isApproved && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              This {type} has been approved by the team! All required signatures have been collected.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
} 