"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignatureWidget } from './SignatureWidget';
import { SignatureDetails } from './SignatureDetails';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Shield,
  Info
} from 'lucide-react';

interface SignatureExampleProps {
  projectId: string;
  projectTitle: string;
  teamId: string;
  teamMembers: string[];
}

export function SignatureExample({ 
  projectId, 
  projectTitle, 
  teamId, 
  teamMembers 
}: SignatureExampleProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Project Approval System</h2>
        <p className="text-muted-foreground">
          Team members must cryptographically sign to approve project completion
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This example demonstrates the cryptographic signature system. Team members use their wallets to sign project approvals, 
          ensuring projects only pass when more than 50% of team members have signed.
        </AlertDescription>
      </Alert>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
          <CardDescription>
            Project: {projectTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Total Team Members:</span>
              <Badge variant="outline">{teamMembers.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Required Signatures:</span>
              <Badge variant="outline">{Math.ceil(teamMembers.length * 0.5)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Approval Threshold:</span>
              <Badge variant="secondary">More than 50%</Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Team Members:</h4>
            <div className="space-y-1">
              {teamMembers.map((member, index) => (
                <div key={member} className="text-sm text-muted-foreground">
                  {index + 1}. {member.slice(0, 6)}...{member.slice(-4)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Project Approval
          </CardTitle>
          <CardDescription>
            Sign with your wallet to approve this project for completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureWidget
            type="project"
            id={projectId}
            title={projectTitle}
            teamId={teamId}
            onStatusChange={(status) => {
              console.log('Project status changed:', status);
            }}
          />
        </CardContent>
      </Card>

      {/* Signature Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Signature Details
          </CardTitle>
          <CardDescription>
            View detailed information about all signatures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show Signature Details</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            {showDetails && (
              <SignatureDetails
                signatures={[]} // This would be populated from the API
                totalMembers={teamMembers.length}
                requiredSignatures={Math.ceil(teamMembers.length * 0.5)}
                isApproved={false}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Signature System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Message Creation</h4>
              <p className="text-sm text-muted-foreground">
                The system creates a unique message containing project details, team information, 
                and a timestamp to prevent replay attacks.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Wallet Signing</h4>
              <p className="text-sm text-muted-foreground">
                Team members use their wallet (MetaMask, etc.) to cryptographically sign the message 
                using their private key.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Signature Verification</h4>
              <p className="text-sm text-muted-foreground">
                The server verifies each signature cryptographically and ensures the signer is a team member.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Threshold Check</h4>
              <p className="text-sm text-muted-foreground">
                Once more than 50% of team members have signed, the project is automatically approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Cryptographic Verification</h4>
              <p className="text-sm text-muted-foreground">
                All signatures are cryptographically verified using the signer's public key
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Nonce Protection</h4>
              <p className="text-sm text-muted-foreground">
                Each signature includes a unique nonce to prevent replay attacks
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Team Membership Check</h4>
              <p className="text-sm text-muted-foreground">
                Only verified team members can sign projects and tasks
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Duplicate Prevention</h4>
              <p className="text-sm text-muted-foreground">
                Each team member can only sign once per project/task
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 