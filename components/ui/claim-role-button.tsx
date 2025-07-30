"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { getSigner, createSquadTrustService } from "@/lib/contract";
import { getBytes } from "ethers";

interface ClaimRoleButtonProps {
  projectId: string;
  blockchainProjectId?: string; // Add blockchain project ID
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ClaimRoleButton({ projectId, blockchainProjectId, className, variant = "default", size = "sm" }: ClaimRoleButtonProps) {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [minStake, setMinStake] = useState<string>("0.01");
  const { address, isConnected } = useWallet();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load minimum stake when dialog opens
  const loadMinStake = async () => {
    try {
      const signer = await getSigner();
      if (signer) {
        const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || "0x0b306bf915c4d645ff596e518faf3f9669b97016";
        const squadTrustService = createSquadTrustService(contractAddress, signer);
        const minStakeAmount = await squadTrustService.getMinStake();
        setMinStake(minStakeAmount);
      }
    } catch (err) {
      console.warn("Failed to load minimum stake:", err);
    }
  };

  const onClaimRole = async (data: any) => {
    if (!isConnected || !address) {
      setError("Please connect your wallet to claim a role");
      return;
    }

    setClaiming(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the signer from the connected wallet
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get wallet signer");
      }

      // Create SquadTrust service instance
      // You'll need to replace this with your actual contract address
      const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || "0x0b306bf915c4d645ff596e518faf3f9669b97016";
      const squadTrustService = createSquadTrustService(contractAddress, signer);

      // Get minimum stake amount
      const minStake = await squadTrustService.getMinStake();
      
      // Use the minimum stake amount or allow user to specify
      const stakeAmount = data.stakeAmount || minStake;

      console.log("Claiming role with:", {
        projectId,
        blockchainProjectId,
        role: data.roleTitle,
        stakeAmount,
        userAddress: address
      });

      // Use the blockchain project ID if available, otherwise show error
      if (!blockchainProjectId) {
        throw new Error("Blockchain project ID not available. This project may not have been created on the blockchain.");
      }

      // Claim role on blockchain using the actual blockchain project ID
      await squadTrustService.claimRole(getBytes(blockchainProjectId), data.roleTitle);

      // Also create the role in the database
      const res = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          roleTitle: data.roleTitle,
          description: data.description,
        }),
      });

      if (!res.ok) {
        const responseData = await res.json();
        console.warn("Database role creation failed:", responseData.error);
        // Don't throw error here as blockchain transaction succeeded
      }

      setSuccess(true);
      reset();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error claiming role:", err);
      
      // Handle specific blockchain errors
      let errorMessage = "Failed to claim role on blockchain";
      
      if (err.code === 4001) {
        errorMessage = "Transaction was rejected by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance for stake amount";
      } else if (err.message?.includes("already claimed")) {
        errorMessage = "You have already claimed a role in this project";
      } else if (err.message?.includes("insufficient stake")) {
        errorMessage = `Stake amount must be at least ${minStake} ETH`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setClaiming(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      loadMinStake();
    }
    if (!newOpen) {
      reset();
      setError(null);
      setSuccess(false);
    }
    setOpen(newOpen);
  };

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
          <UserPlus className="w-4 h-4 mr-2" />
          Claim Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim a Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onClaimRole)} className="space-y-4">
          <div>
            <Label htmlFor="roleTitle">Role Title</Label>
            <Input 
              id="roleTitle" 
              placeholder="e.g. Frontend Developer, Smart Contract Dev" 
              {...register("roleTitle", { required: "Role title is required" })} 
            />
            {errors.roleTitle && (
              <p className="text-sm text-destructive mt-1">
                {errors.roleTitle.message as string}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your contribution and responsibilities..." 
              {...register("description", { required: "Description is required" })} 
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message as string}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="stakeAmount">Stake Amount (ETH)</Label>
            <Input 
              id="stakeAmount" 
              type="number"
              step="0.001"
              placeholder={minStake}
              defaultValue={minStake}
              {...register("stakeAmount", { 
                required: "Stake amount is required",
                min: { value: parseFloat(minStake), message: `Minimum stake is ${minStake} ETH` }
              })} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum stake: {minStake} ETH
            </p>
            {errors.stakeAmount && (
              <p className="text-sm text-destructive mt-1">
                {errors.stakeAmount.message as string}
              </p>
            )}
          </div>
          {!isConnected && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              Please connect your wallet to claim a role
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">Role claimed successfully on blockchain!</p>
          )}
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={claiming || !isConnected}
              className=""
            >
              {claiming ? "Claiming on Blockchain..." : "Claim Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 