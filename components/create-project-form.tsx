"use client"

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateProjectForm({ teamId, redirectToProjects }: { teamId: string, redirectToProjects?: boolean }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { address, isConnected, connectWallet, isConnecting } = useWallet();

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    setSuccess(false);
    
    // Check if wallet is connected
    if (!isConnected || !address) {
      setSubmitError("Please connect your wallet to create a project on the blockchain.");
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          walletAddress: address,
          requiredConfirmations: 2, // Default value
        }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create project");
      }
      setSuccess(true);
      reset();
      if (redirectToProjects) {
        router.push("/projects");
      }
      // Optionally, trigger a refresh of the project list here
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to connect your wallet to create a project on the blockchain.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={connectWallet} 
          className="w-full"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">
            Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      </div>
      
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" type="text" placeholder="Project title" {...register("title", { required: "Title is required" })} />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message as string}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe your project..." {...register("description", { required: "Description is required" })} />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message as string}</p>}
      </div>
      <div>
        <Label htmlFor="githubRepo">GitHub Repo</Label>
        <Input id="githubRepo" type="url" placeholder="https://github.com/yourrepo" {...register("githubRepo")} />
      </div>
      <div>
        <Label htmlFor="liveUrl">Live URL</Label>
        <Input id="liveUrl" type="url" placeholder="https://yourproject.com" {...register("liveUrl")} />
      </div>
      {submitError && <p className="text-sm text-destructive mt-2">{submitError}</p>}
      {success && <p className="text-sm text-green-600 mt-2">Project created successfully on blockchain!</p>}
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating on blockchain..." : "Create Project"}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="ghost">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
} 