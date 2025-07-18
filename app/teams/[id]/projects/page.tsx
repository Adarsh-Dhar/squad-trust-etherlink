"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
}

export default function CreateProjectStandalonePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm();
  const selectedTeamId = watch("teamId");

  useEffect(() => {
    async function fetchTeams() {
      setLoadingTeams(true);
      setFetchError(null);
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Failed to fetch teams");
        setTeams(data);
      } catch (e: any) {
        setFetchError(e.message || "Failed to load teams");
      } finally {
        setLoadingTeams(false);
      }
    }
    fetchTeams();
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/teams/${data.teamId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          githubRepo: data.githubRepo,
          liveUrl: data.liveUrl,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create project");
      }
      setSuccess(true);
      reset();
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    }
  };

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
                  defaultValue=""
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
            {success && <p className="text-sm text-green-600 mt-2">Project created successfully!</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting || loadingTeams}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <span className="text-sm text-muted-foreground">Projects are always created under a team. Select your team and fill in the details.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
