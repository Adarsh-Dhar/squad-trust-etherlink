"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getSigner, createSquadTrustService } from "@/lib/contract";

interface Team {
  id: string;
  name: string;
  members: {
    id: string;
    role: string;
    user: {
      id: string;
      walletAddress: string;
    };
  }[];
}

export default function CreateProjectStandalonePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [blockchainProjectId, setBlockchainProjectId] = useState<string | null>(null);
  const router = useRouter();
  const { address } = useWallet();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm();
  const selectedTeamId = watch("teamId");

  // Contract address - should match the one in the API
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || "0x0b306bf915c4d645ff596e518faf3f9669b97016";

  // Handle params
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Check if user is admin of the team
  useEffect(() => {
    async function checkAdminStatus() {
      if (!address || !id) {
        setLoadingAuth(false);
        return;
      }

      try {
        const response = await fetch(`/api/teams/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }
        
        const teamData = await response.json();
        const normalizedUserAddress = address.toLowerCase();
        
        // Check if user is a member with ADMIN role
        const isMember = teamData.members.some((member: any) => {
          const normalizedMemberAddress = member.user.walletAddress.toLowerCase();
          return normalizedMemberAddress === normalizedUserAddress && member.role === 'ADMIN';
        });
        
        setIsAdmin(isMember);
      } catch (err: any) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setLoadingAuth(false);
      }
    }

    checkAdminStatus();
  }, [address, id]);

  useEffect(() => {
    async function fetchTeams() {
      setLoadingTeams(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Failed to fetch teams");
        setTeams(data);
        
        // Pre-select the team if we have a teamId from the URL
        if (id) {
          const teamExists = data.find((team: Team) => team.id === id);
          if (teamExists) {
            setValue("teamId", id);
          }
        }
      } catch (e: any) {
        setFetchError(e.message || "Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    }
    fetchTeams();
  }, [id, setValue]);

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    setSuccess(false);
    setBlockchainProjectId(null);
    
    // Check if wallet is connected
    if (!address) {
      setSubmitError("Please connect your wallet to create a project on the blockchain.");
      return;
    }
    
    try {
      // Step 1: Execute blockchain transaction first
      // console.log("Step 1: Creating project on blockchain...");
      
      // Get signer from connected wallet
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get wallet signer. Please ensure MetaMask is connected.");
      }

      // Create SquadTrust service
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      
      // Create project on blockchain
      const requiredConfirmations = 2; // Default value
      const budget = "1000"; // Default budget in ETH
      const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
      const blockchainProjectId = await squadTrustService.createProject(data.title, requiredConfirmations, budget, deadline);
      
      // console.log("Blockchain project created with ID:", blockchainProjectId);
      setBlockchainProjectId(blockchainProjectId);

      // Step 2: Create project in database with blockchain reference
      // console.log("Step 2: Creating project in database...");
      
      const res = await fetch(`/api/teams/${data.teamId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          githubRepo: data.githubRepo,
          liveUrl: data.liveUrl,
          walletAddress: address,
          requiredConfirmations: requiredConfirmations,
          blockchainProjectId: blockchainProjectId, // Pass the blockchain project ID
        }),
      });
      
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create project in database");
      }
      
      setSuccess(true);
      reset();
      
      // Redirect back to the team page after successful creation
      setTimeout(() => {
        router.push(`/teams/${data.teamId}`);
      }, 1500);
      
    } catch (err: any) {
      console.error("Error creating project:", err);
      setSubmitError(err.message || "Something went wrong");
    }
  };

  // Show loading state
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-2">
        <Card className="w-full max-w-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to connect your wallet to create projects on the blockchain.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full mt-4"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-2">
        <Card className="w-full max-w-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only team administrators can create projects. You need to be an admin of this team to access this page.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.back()} 
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-2">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader>
          <CardTitle>Create a New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="teamId">Select Team</Label>
              {loadingTeams ? (
                <div className="text-muted-foreground text-sm mt-2">Loading teams...</div>
              ) : fetchError ? (
                <div className="text-destructive text-sm mt-2">{fetchError}</div>
              ) : (
                <select
                  id="teamId"
                  {...register("teamId", { required: "Please select a team" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  defaultValue={id || ""}
                >
                  <option value="" disabled>
                    -- Select a team --
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.teamId && <p className="text-sm text-destructive mt-1">{errors.teamId.message as string}</p>}
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
            {blockchainProjectId && (
              <p className="text-sm text-blue-600 mt-2">
                ✅ Project created on blockchain with ID: {blockchainProjectId}
              </p>
            )}
            {success && <p className="text-sm text-green-600 mt-2">Project created successfully! Redirecting...</p>}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting || loadingTeams}>
                {isSubmitting ? "Creating project..." : "Create Project"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <span className="text-sm text-muted-foreground">Projects are created on the blockchain first, then stored in the database.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
