"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as DialogFooterUI, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

interface Project {
  id: string;
  title: string;
  description?: string;
  teamId: string;
  githubRepo?: string;
  liveUrl?: string;
  status?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

interface Funding {
  id: string;
  amount: number;
  currency: string;
  source?: string;
  txHash?: string;
  receivedAt?: string;
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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneLoading, setMilestoneLoading] = useState(true);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [addMilestoneLoading, setAddMilestoneLoading] = useState(false);
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [fundingLoading, setFundingLoading] = useState(true);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [addFundingOpen, setAddFundingOpen] = useState(false);
  const [addFundingLoading, setAddFundingLoading] = useState(false);

  // Milestone form
  const { register: registerMilestone, handleSubmit: handleSubmitMilestone, reset: resetMilestone, formState: { errors: milestoneErrors, isSubmitting: isSubmittingMilestone } } = useForm();
  // Funding form
  const { register: registerFunding, handleSubmit: handleSubmitFunding, reset: resetFunding, formState: { errors: fundingErrors, isSubmitting: isSubmittingFunding } } = useForm();

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

  // Fetch milestones
  useEffect(() => {
    async function fetchMilestones() {
      setMilestoneLoading(true);
      setMilestoneError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/milestones`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch milestones");
        setMilestones(data);
      } catch (e: any) {
        setMilestoneError(e.message || "Failed to load milestones");
      } finally {
        setMilestoneLoading(false);
      }
    }
    if (projectId) fetchMilestones();
  }, [projectId]);

  // Fetch funding
  useEffect(() => {
    async function fetchFunding() {
      setFundingLoading(true);
      setFundingError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/funding`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch funding");
        setFundings(data);
      } catch (e: any) {
        setFundingError(e.message || "Failed to load funding");
      } finally {
        setFundingLoading(false);
      }
    }
    if (projectId) fetchFunding();
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

  // Add milestone
  const onAddMilestone = async (data: any) => {
    setAddMilestoneLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to add milestone");
      setMilestones((prev) => [...prev, responseData]);
      resetMilestone();
      setAddMilestoneOpen(false);
    } catch (e: any) {
      setMilestoneError(e.message || "Failed to add milestone");
    } finally {
      setAddMilestoneLoading(false);
    }
  };

  // Mark milestone as complete
  const markMilestoneComplete = async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark milestone as complete");
      setMilestones((prev) => prev.map(m => m.id === milestoneId ? { ...m, completed: true } : m));
    } catch (e: any) {
      setMilestoneError(e.message || "Failed to mark milestone as complete");
    }
  };

  // Add funding
  const onAddFunding = async (data: any) => {
    setAddFundingLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/funding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to add funding");
      setFundings((prev) => [...prev, responseData]);
      resetFunding();
      setAddFundingOpen(false);
    } catch (e: any) {
      setFundingError(e.message || "Failed to add funding");
    } finally {
      setAddFundingLoading(false);
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

      {/* Milestones Section */}
      <div className="w-full max-w-lg mt-8 animate-fade-in">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Milestones</CardTitle>
            <Button size="sm" onClick={() => setAddMilestoneOpen(true)}>Add Milestone</Button>
          </CardHeader>
          <CardContent>
            {milestoneLoading ? (
              <div className="text-muted-foreground">Loading milestones...</div>
            ) : milestoneError ? (
              <div className="text-destructive">{milestoneError}</div>
            ) : milestones.length === 0 ? (
              <div className="text-muted-foreground">No milestones yet.</div>
            ) : (
              <ul className="space-y-3">
                {milestones.map(milestone => (
                  <li key={milestone.id} className="flex items-center justify-between p-3 rounded bg-muted">
                    <div>
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-sm text-muted-foreground">{milestone.description}</div>
                      {milestone.dueDate && <div className="text-xs text-muted-foreground">Due: {milestone.dueDate.slice(0, 10)}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {milestone.completed ? (
                        <span className="text-green-600 text-xs font-semibold">Completed</span>
                      ) : (
                        <Button size="sm" variant="success" onClick={() => markMilestoneComplete(milestone.id)}>Mark Complete</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Add Milestone Dialog */}
        <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitMilestone(onAddMilestone)} className="space-y-4">
              <div>
                <Label htmlFor="milestone-title">Title</Label>
                <Input id="milestone-title" {...registerMilestone("title", { required: "Title is required" })} />
                {milestoneErrors.title && <p className="text-sm text-destructive mt-1">{milestoneErrors.title.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="milestone-description">Description</Label>
                <Textarea id="milestone-description" {...registerMilestone("description")} />
              </div>
              <div>
                <Label htmlFor="milestone-dueDate">Due Date</Label>
                <Input id="milestone-dueDate" type="date" {...registerMilestone("dueDate")} />
              </div>
              <DialogFooterUI className="flex gap-2">
                <Button type="submit" disabled={addMilestoneLoading || isSubmittingMilestone}>{addMilestoneLoading ? "Adding..." : "Add"}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
              </DialogFooterUI>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funding Section */}
      <div className="w-full max-w-lg mt-8 animate-fade-in">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Funding</CardTitle>
            <Button size="sm" onClick={() => setAddFundingOpen(true)}>Log Funding</Button>
          </CardHeader>
          <CardContent>
            {fundingLoading ? (
              <div className="text-muted-foreground">Loading funding...</div>
            ) : fundingError ? (
              <div className="text-destructive">{fundingError}</div>
            ) : fundings.length === 0 ? (
              <div className="text-muted-foreground">No funding entries yet.</div>
            ) : (
              <ul className="space-y-3">
                {fundings.map(funding => (
                  <li key={funding.id} className="flex items-center justify-between p-3 rounded bg-muted">
                    <div>
                      <div className="font-medium">{funding.amount} {funding.currency}</div>
                      {funding.source && <div className="text-xs text-muted-foreground">Source: {funding.source}</div>}
                      {funding.txHash && <div className="text-xs text-muted-foreground">Tx: {funding.txHash}</div>}
                      {funding.receivedAt && <div className="text-xs text-muted-foreground">Received: {funding.receivedAt.slice(0, 10)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Add Funding Dialog */}
        <Dialog open={addFundingOpen} onOpenChange={setAddFundingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Funding</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitFunding(onAddFunding)} className="space-y-4">
              <div>
                <Label htmlFor="funding-amount">Amount</Label>
                <Input id="funding-amount" type="number" step="any" {...registerFunding("amount", { required: "Amount is required", valueAsNumber: true })} />
                {fundingErrors.amount && <p className="text-sm text-destructive mt-1">{fundingErrors.amount.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="funding-currency">Currency</Label>
                <Input id="funding-currency" {...registerFunding("currency", { required: "Currency is required" })} />
                {fundingErrors.currency && <p className="text-sm text-destructive mt-1">{fundingErrors.currency.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="funding-source">Source</Label>
                <Input id="funding-source" {...registerFunding("source")} />
              </div>
              <div>
                <Label htmlFor="funding-txHash">Transaction Hash</Label>
                <Input id="funding-txHash" {...registerFunding("txHash")} />
              </div>
              <DialogFooterUI className="flex gap-2">
                <Button type="submit" disabled={addFundingLoading || isSubmittingFunding}>{addFundingLoading ? "Logging..." : "Log"}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
              </DialogFooterUI>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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