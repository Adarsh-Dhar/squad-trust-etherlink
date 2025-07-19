"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SignatureData {
  signer: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
}

interface SignatureDetailsProps {
  signatures: SignatureData[];
  totalMembers: number;
  requiredSignatures: number;
  isApproved: boolean;
}

export function SignatureDetails({ 
  signatures, 
  totalMembers, 
  requiredSignatures, 
  isApproved 
}: SignatureDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getSignatureStatus = (index: number) => {
    if (index < requiredSignatures) {
      return 'required';
    }
    return 'additional';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Signature Details
            </CardTitle>
            <CardDescription>
              {signatures.length} of {totalMembers} team members have signed
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Total Signatures:</span>
              <Badge variant="outline">{signatures.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span>Required:</span>
              <Badge variant="outline">{requiredSignatures}</Badge>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={isApproved ? "default" : "secondary"}
              className={isApproved ? "bg-green-500" : ""}
            >
              {isApproved ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {isApproved ? 'Approved' : 'Pending Approval'}
            </Badge>
          </div>

          {/* Signature List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Signatures:</h4>
            {signatures.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No signatures yet
              </div>
            ) : (
              <div className="space-y-2">
                {signatures.map((signature, index) => (
                  <div
                    key={signature.signer}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getSignatureStatus(index) === 'required' ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <span className="font-mono text-sm">
                          {formatAddress(signature.signer)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(signature.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signature Hashes (for verification) */}
          {signatures.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Signature Hashes:</h4>
              <div className="space-y-2">
                {signatures.map((signature, index) => (
                  <div key={signature.signer} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">Signer {index + 1}:</span>
                      <span className="font-mono text-muted-foreground">
                        {formatAddress(signature.signer)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground break-all">
                        {signature.signature.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Cryptographic Verification
            </h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>• Each signature is cryptographically verified using the signer's private key</p>
              <p>• Signatures are unique and cannot be forged or reused</p>
              <p>• Only team members can sign projects and tasks</p>
              <p>• Project/task is approved when more than 50% of team members sign</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 