"use client"

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BlockchainProjectExample() {
  const { address, isConnected, connectWallet, isConnecting } = useWallet();
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<any>(null);

  const handleCreateProject = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!projectTitle || !projectDescription) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // For demo purposes, we'll use a mock team ID
      // In a real app, you'd get this from the current team context
      const mockTeamId = "demo-team-id";
      
      const response = await fetch(`/api/teams/${mockTeamId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription,
          walletAddress: address,
          requiredConfirmations: 2,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setSuccess("Project created successfully on blockchain!");
      setCreatedProject(data);
      setProjectTitle("");
      setProjectDescription("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Blockchain Project Creation Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your wallet to create a project on the blockchain
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
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {createdProject && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Project Created!</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Database ID:</strong> {createdProject.id}</p>
                    <p><strong>Blockchain ID:</strong> {createdProject.blockchainProjectId}</p>
                    <p><strong>Title:</strong> {createdProject.name}</p>
                    <p><strong>Status:</strong> {createdProject.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isConnected && (
            <Button 
              onClick={handleCreateProject}
              disabled={isCreating || !projectTitle || !projectDescription}
              className="w-full"
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating on blockchain...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Create Project on Blockchain</span>
                </div>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 