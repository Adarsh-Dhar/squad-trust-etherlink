'use client';

import React, { useEffect } from 'react';
import { useInvestorSignatures } from '@/hooks/useInvestorSignatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Users,
  Signature
} from 'lucide-react';

interface InvestorSignatureWidgetProps {
  type: 'project' | 'milestone';
  id: string;
  title: string;
  projectId: string;
  amount: number;
  currency: string;
  onStatusChange?: (status: string) => void;
}

export function InvestorSignatureWidget({ 
  type, 
  id, 
  title, 
  projectId, 
  amount, 
  currency,
  onStatusChange 
}: InvestorSignatureWidgetProps) {
  const { 
    signatureStatus, 
    loading, 
    signing, 
    error, 
    signWithWallet, 
    canSign, 
    isApproved,
    fetchSignatureStatus 
  } = useInvestorSignatures({ 
    type, 
    id, 
    title, 
    projectId, 
    amount, 
    currency 
  });

  useEffect(() => {
    fetchSignatureStatus();
  }, [fetchSignatureStatus]);

  useEffect(() => {
    if (signatureStatus?.status) {
      onStatusChange?.(signatureStatus.status);
    }
  }, [signatureStatus?.status, onStatusChange]);

  const handleSign = async () => {
    try {
      await signWithWallet();
    } catch (error) {
      console.error('Failed to sign payment:', error);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-muted rounded" />
            <div className="h-6 w-32 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!signatureStatus) {
    return null;
  }

  const { 
    totalInvestors, 
    requiredSignatures, 
    signatures, 
    status, 
    percentageComplete,
    missingSignatures 
  } = signatureStatus;

  const getStatusIcon = () => {
    if (isApproved) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'PENDING') return <Clock className="h-5 w-5 text-yellow-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isApproved) return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {type === 'project' ? 'Project Payment' : 'Milestone Payment'}
            </CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">
              {isApproved ? 'Approved' : status === 'PENDING' ? 'Pending' : 'Rejected'}
            </span>
          </Badge>
        </div>
        <CardDescription>
          {type === 'project' ? 'Project funding payment' : 'Milestone completion payment'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Details */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Payment Amount</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{amount} {currency}</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>
        </div>

        {/* Signature Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signature className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Investor Signatures</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {signatures.length} / {requiredSignatures} required
            </span>
          </div>
          
          <Progress value={percentageComplete} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(percentageComplete)}% complete</span>
            <span>{totalInvestors} total investors</span>
          </div>
        </div>

        {/* Signature List */}
        {signatures.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Signed Investors</span>
            </div>
            <div className="space-y-1">
              {signatures.map((sig, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                  <span className="font-mono">
                    {sig.signer.slice(0, 6)}...{sig.signer.slice(-4)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(sig.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Signatures */}
        {missingSignatures && missingSignatures.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pending Signatures</span>
            </div>
            <div className="space-y-1">
              {missingSignatures.map((investor, index) => (
                <div key={index} className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="font-mono">
                    {investor.slice(0, 6)}...{investor.slice(-4)}
                  </span>
                </div>
              ))}
            </div>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing Payment...
              </>
            ) : (
              <>
                <Signature className="h-4 w-4 mr-2" />
                Sign Payment
              </>
            )}
          </Button>
        )}

        {isApproved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Payment approved! Funds will be released.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 