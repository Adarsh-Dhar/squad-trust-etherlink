"use client"

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function CreateProjectForm({ teamId, redirectToProjects }: { teamId: string, redirectToProjects?: boolean }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/teams/${teamId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Project"}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="ghost">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
} 