"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Shield, CheckCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { getSigner, createSquadTrustService } from "@/lib/contract";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { squadtrust_address } from '@/lib/contract/address';

interface VerifyRoleButtonProps {
  projectId: string;
  blockchainProjectId?: string;
  memberAddress: string;
  memberName?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function VerifyRoleButton({ 
  projectId, 
  blockchainProjectId, 
  memberAddress, 
  memberName,
  className, 
  variant = "outline", 
  size = "sm" 
}: VerifyRoleButtonProps) {
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { address, isConnected } = useWallet();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onVerifyRole = async (data: any) => {
    if (!isConnected || !address) {
      setError("Please connect your wallet to verify roles");
      return;
    }

    setVerifying(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the signer from the connected wallet
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get wallet signer");
      }

      // Create SquadTrust service instance
      const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || squadtrust_address;
      const squadTrustService = createSquadTrustService(contractAddress, signer);

      console.log("Verifying role with:", {
        projectId,
        blockchainProjectId,
        memberAddress,
        userAddress: address
      });

      // Use the blockchain project ID if available, otherwise show error
      if (!blockchainProjectId) {
        throw new Error("Blockchain project ID not available. This project may not have been created on the blockchain.");
      }

      // Verify role on blockchain using the actual blockchain project ID
      await squadTrustService.verifyRole(blockchainProjectId, memberAddress);

      // Also update the role verification in the database
      const res = await fetch(`/api/projects/${projectId}/roles/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberAddress: memberAddress,
          verified: true,
        }),
      });

      if (!res.ok) {
        const responseData = await res.json();
        console.warn("Database role verification update failed:", responseData.error);
        // Don't throw error here as blockchain transaction succeeded
      }

      setSuccess(true);
      reset();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error verifying role:", err);
      
      // Handle specific blockchain errors
      let errorMessage = "Failed to verify role on blockchain";
      
      if (err.code === 4001) {
        errorMessage = "Transaction was rejected by user";
      } else if (err.message?.includes("not authorized")) {
        errorMessage = "Only the project creator can verify roles";
      } else if (err.message?.includes("already verified")) {
        errorMessage = "This role has already been verified";
      } else if (err.message?.includes("role not claimed")) {
        errorMessage = "This member has not claimed a role yet";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
      setSuccess(false);
    }
    setOpen(newOpen);
  };

  const displayName = memberName || `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={(e) => e.stopPropagation()}
          disabled={!isConnected}
        >
          <Shield className="w-4 h-4 mr-2" />
          Verify Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Team Member Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onVerifyRole)} className="space-y-4">
          <div>
            <Label htmlFor="memberAddress">Member Address</Label>
            <Input 
              id="memberAddress" 
              value={memberAddress}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {displayName}
            </p>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              By verifying this role, you confirm that this team member has fulfilled their responsibilities 
              and is eligible to withdraw their stake. This action can only be performed by the project creator.
            </AlertDescription>
          </Alert>

          {!isConnected && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              Please connect your wallet to verify roles
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">Role verified successfully on blockchain!</p>
          )}
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={verifying || !isConnected}
              className="w-full"
            >
              {verifying ? "Verifying on Blockchain..." : "Verify Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 