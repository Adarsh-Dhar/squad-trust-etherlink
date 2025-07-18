"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as DialogFooterUI, DialogClose } from "@/components/ui/dialog";

interface Project {
  id: string;
  title: string;
  description?: string;
  teamId: string;
  githubRepo?: string;
  liveUrl?: string;
  status?: string;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({ title: "", description: "", githubRepo: "", liveUrl: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch project");
        setProject(data);
      } catch (e: any) {
        setError(e.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  const openEdit = () => {
    if (project) {
      setEditData({
        title: project.title || "",
        description: project.description || "",
        githubRepo: project.githubRepo || "",
        liveUrl: project.liveUrl || "",
      });
      setEditOpen(true);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");
      setProject(data);
      setEditOpen(false);
      setSuccessMsg("Project updated successfully!");
    } catch (e: any) {
      setError(e.message || "Failed to update project");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");
      setDeleteOpen(false);
      setSuccessMsg("Project deleted. Redirecting...");
      setTimeout(() => router.push("/teams/projects"), 1200);
    } catch (e: any) {
      setError(e.message || "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as completed");
      setProject((prev) => prev ? { ...prev, status: "COMPLETED" } : prev);
      setSuccessMsg("Project marked as completed!");
    } catch (e: any) {
      setError(e.message || "Failed to mark as completed");
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading project...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-destructive">{error}</div>;
  if (!project) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Project not found.</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-2">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Description</Label>
            <p className="text-muted-foreground mt-1 whitespace-pre-line">{project.description || "No description"}</p>
          </div>
          <div>
            <Label>GitHub Repo</Label>
            {project.githubRepo ? (
              <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{project.githubRepo}</a>
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
          <div>
            <Label>Live URL</Label>
            {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">{project.liveUrl}</a>
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${project.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{project.status || "ONGOING"}</span>
          </div>
          {successMsg && <div className="text-green-600 text-sm mt-2">{successMsg}</div>}
          {error && <div className="text-destructive text-sm mt-2">{error}</div>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <div className="flex gap-2 w-full">
            <Button variant="secondary" className="flex-1" onClick={openEdit}>Edit</Button>
            <Button variant="destructive" className="flex-1" onClick={() => setDeleteOpen(true)}>Delete</Button>
            {project.status !== "COMPLETED" && (
              <Button variant="success" className="flex-1" onClick={handleComplete} disabled={completeLoading}>
                {completeLoading ? "Marking..." : "Mark as Completed"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="githubRepo">GitHub Repo</Label>
              <Input id="githubRepo" type="url" value={editData.githubRepo} onChange={e => setEditData({ ...editData, githubRepo: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="liveUrl">Live URL</Label>
              <Input id="liveUrl" type="url" value={editData.liveUrl} onChange={e => setEditData({ ...editData, liveUrl: e.target.value })} />
            </div>
            <DialogFooterUI className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="flex-1">Cancel</Button>
              </DialogClose>
            </DialogFooterUI>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <DialogFooterUI className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
    </div>
  );
} 