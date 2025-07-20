"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface TeamFormValues {
  name: string;
  bio?: string;
  website?: string;
  tags?: string[];
}

export default function CreateTeamPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TeamFormValues>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { address, isConnected, connectWallet, isConnecting } = useWallet();

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onSubmit = async (data: TeamFormValues) => {
    setSubmitError(null);
    
    // Check if wallet is connected
    if (!isConnected || !address) {
      setSubmitError("Please connect your wallet to create a team.");
      return;
    }

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...data, 
          tags,
          createdBy: address 
        }),
      });
      const responseData = await res.json();
      // console.log("Team creation response:", responseData);
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create team");
      }
      // Optionally, redirect to teams page or new team page
      router.push("/teams");
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
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
                You need to connect your wallet to create a team.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={connectWallet} 
              className="w-full mt-4"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Connect Wallet</span>
                </div>
              )}
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
          <CardTitle>Create a New Team</CardTitle>
          <div className="text-sm text-muted-foreground">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" type="text" autoComplete="off" placeholder="e.g. DeFi Innovators" {...register("name", { required: "Team name is required" })} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="bio">Bio / Description</Label>
              <Textarea id="bio" placeholder="Tell us about your team..." {...register("bio")}/>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" autoComplete="off" placeholder="https://yourteam.com" {...register("website")}/>
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-xs text-destructive hover:underline"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <span className="text-sm text-muted-foreground">After creating, you can add members and projects to your team.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
