"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle, DialogFooter as UIDialogFooter, DialogClose as UIDialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { SignatureWidget } from "@/components/signature/SignatureWidget";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  Edit, 
  Trash2, 
  CheckCircle,
  ExternalLink,
  Github,
  Globe
} from "lucide-react";

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

  // Roles state and form
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { register: registerRole, handleSubmit: handleSubmitRole, reset: resetRole, formState: { errors: roleErrors, isSubmitting: isClaiming } } = useForm();

  // MOCK USER ID (replace with real user/session logic when available)
  const MOCK_USER_ID = "cmd972xif0004u64it5kpuvec";

  // Add to ProjectDetailsPage function, after roles state
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRoleData, setEditRoleData] = useState({ roleTitle: "", description: "" });
  const [editRoleLoading, setEditRoleLoading] = useState(false);
  const [editRoleError, setEditRoleError] = useState<string | null>(null);
  const [editRoleSuccess, setEditRoleSuccess] = useState(false);

  const [verifyRoleId, setVerifyRoleId] = useState<string | null>(null);
  const [verifyComment, setVerifyComment] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [viewVerificationsRoleId, setViewVerificationsRoleId] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationsError, setVerificationsError] = useState<string | null>(null);

  // Edit role handler
  const openEditRole = (role: any) => {
    setEditRoleId(role.id);
    setEditRoleData({ roleTitle: role.roleTitle, description: role.description });
    setEditRoleError(null);
    setEditRoleSuccess(false);
  };
  const closeEditRole = () => {
    setEditRoleId(null);
    setEditRoleData({ roleTitle: "", description: "" });
    setEditRoleError(null);
    setEditRoleSuccess(false);
  };
  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleId) return;
    setEditRoleLoading(true);
    setEditRoleError(null);
    setEditRoleSuccess(false);
    try {
      const res = await fetch(`/api/roles/${editRoleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRoleData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setRoles((prev) => prev.map((r) => (r.id === editRoleId ? { ...r, ...editRoleData } : r)));
      setEditRoleSuccess(true);
      setTimeout(closeEditRole, 1000);
    } catch (e: any) {
      setEditRoleError(e.message || "Failed to update role");
    } finally {
      setEditRoleLoading(false);
    }
  };

  // Verify role handler (stubbed, as endpoint is not implemented)
  const openVerifyRole = (roleId: string) => {
    setVerifyRoleId(roleId);
    setVerifyComment("");
    setVerifyError(null);
    setVerifySuccess(false);
  };
  const closeVerifyRole = () => {
    setVerifyRoleId(null);
    setVerifyComment("");
    setVerifyError(null);
    setVerifySuccess(false);
  };
  const handleVerifyRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRoleId) return;
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifySuccess(false);
    // STUB: Simulate success
    setTimeout(() => {
      setVerifySuccess(true);
      setVerifyLoading(false);
      setTimeout(closeVerifyRole, 1000);
    }, 1000);
  };

  // View verifications handler (stubbed, as endpoint is not implemented)
  const openViewVerifications = async (roleId: string) => {
    setViewVerificationsRoleId(roleId);
    setVerificationsLoading(true);
    setVerificationsError(null);
    // STUB: Simulate verifications
    setTimeout(() => {
      setVerifications([
        { id: "1", verifier: { name: "Verifier 1" }, comment: "Great work!", createdAt: new Date().toISOString() },
        { id: "2", verifier: { name: "Verifier 2" }, comment: "Solid contribution.", createdAt: new Date().toISOString() },
      ]);
      setVerificationsLoading(false);
    }, 800);
  };
  const closeViewVerifications = () => {
    setViewVerificationsRoleId(null);
    setVerifications([]);
    setVerificationsError(null);
  };

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
      const res = await fetch(`/api/milestones/${milestoneId}/complete`, { 
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
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

  useEffect(() => {
    async function fetchRoles() {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/roles`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch roles");
        setRoles(data);
      } catch (e: any) {
        setRolesError(e.message || "Failed to load roles");
      } finally {
        setRolesLoading(false);
      }
    }
    if (projectId) fetchRoles();
  }, [projectId]);

  const onClaimRole = async (data: any) => {
    setClaimError(null);
    setClaimSuccess(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          roleTitle: data.roleTitle,
          description: data.description,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to claim role");
      setClaimSuccess(true);
      resetRole();
      // Refresh roles list
      setRoles((prev) => [...prev, responseData]);
    } catch (err: any) {
      setClaimError(err.message || "Something went wrong");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading project...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-destructive">{error}</div>;
  if (!project) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Project not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"}>
                {project.status || "ONGOING"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            {project.status !== "COMPLETED" && (
              <Button size="sm" onClick={handleComplete} disabled={completeLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeLoading ? "Marking..." : "Complete"}
              </Button>
            )}
          </div>
        </div>
        
        {successMsg && <div className="text-green-600 text-sm mb-4">{successMsg}</div>}
        {error && <div className="text-destructive text-sm mb-4">{error}</div>}
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="text-gray-600 mt-1 whitespace-pre-line">{project.description || "No description provided"}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Repository
                  </Label>
                  {project.githubRepo ? (
                    <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1">
                      {project.githubRepo}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">Not provided</span>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Live URL
                  </Label>
                  {project.liveUrl ? (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm flex items-center gap-1 mt-1">
                      {project.liveUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">Not provided</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Milestones
              </CardTitle>
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
                <div className="space-y-3">
                  {milestones.map(milestone => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="font-medium">{milestone.title}</div>
                        <div className="text-sm text-muted-foreground">{milestone.description}</div>
                        {milestone.dueDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {milestone.dueDate.slice(0, 10)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {milestone.completed ? (
                          <Badge variant="default" className="bg-green-100 text-green-700">
                            Completed
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => markMilestoneComplete(milestone.id)}>
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funding Tab */}
        <TabsContent value="funding" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Funding
              </CardTitle>
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
                <div className="space-y-3">
                  {fundings.map(funding => (
                    <div key={funding.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="font-medium">{funding.amount} {funding.currency}</div>
                        {funding.source && (
                          <div className="text-sm text-muted-foreground">Source: {funding.source}</div>
                        )}
                        {funding.txHash && (
                          <div className="text-xs text-muted-foreground">Tx: {funding.txHash}</div>
                        )}
                        {funding.receivedAt && (
                          <div className="text-xs text-muted-foreground">Received: {funding.receivedAt.slice(0, 10)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-muted-foreground">Loading roles...</div>
              ) : rolesError ? (
                <div className="text-destructive">{rolesError}</div>
              ) : roles.length === 0 ? (
                <div className="text-muted-foreground">No roles claimed yet.</div>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="font-medium">{role.roleTitle}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Claimed by: <span className="font-semibold">{role.user?.name || role.user?.walletAddress || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2 mt-2 md:mt-0">
                        <Badge variant={role.verified ? "default" : "secondary"}>
                          {role.verified ? "Verified" : "Unverified"}
                        </Badge>
                        {role.verifications && role.verifications.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => openViewVerifications(role.id)}>
                            View Verifications ({role.verifications.length})
                          </Button>
                        )}
                        {role.userId === MOCK_USER_ID ? (
                          <Button size="sm" variant="outline" onClick={() => openEditRole(role)}>Edit</Button>
                        ) : (
                          <Button size="sm" onClick={() => openVerifyRole(role.id)}>Verify</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmitRole(onClaimRole)} className="w-full space-y-4">
                <Label htmlFor="roleTitle">Claim a Role</Label>
                <Input id="roleTitle" placeholder="Role title (e.g. Frontend Dev)" {...registerRole("roleTitle", { required: "Role title is required" })} />
                {roleErrors.roleTitle && <p className="text-sm text-destructive mt-1">{roleErrors.roleTitle.message as string}</p>}
                <Textarea id="roleDescription" placeholder="Describe your contribution..." {...registerRole("description", { required: "Description is required" })} />
                {roleErrors.description && <p className="text-sm text-destructive mt-1">{roleErrors.description.message as string}</p>}
                {claimError && <p className="text-sm text-destructive mt-2">{claimError}</p>}
                {claimSuccess && <p className="text-sm text-green-600 mt-2">Role claimed successfully!</p>}
                <Button type="submit" className="w-full" disabled={isClaiming}>{isClaiming ? "Claiming..." : "Claim Role"}</Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value="approval" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SignatureWidget
                type="project"
                id={projectId}
                title={project?.title || ""}
                teamId={project?.teamId || ""}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Milestone Dialog */}
      <UIDialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Add Milestone</UIDialogTitle>
          </UIDialogHeader>
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
            <UIDialogFooter className="flex gap-2">
              <Button type="submit" disabled={addMilestoneLoading || isSubmittingMilestone}>{addMilestoneLoading ? "Adding..." : "Add"}</Button>
              <UIDialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </UIDialogClose>
            </UIDialogFooter>
          </form>
        </UIDialogContent>
      </UIDialog>

      {/* Add Funding Dialog */}
      <UIDialog open={addFundingOpen} onOpenChange={setAddFundingOpen}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Log Funding</UIDialogTitle>
          </UIDialogHeader>
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
            <UIDialogFooter className="flex gap-2">
              <Button type="submit" disabled={addFundingLoading || isSubmittingFunding}>{addFundingLoading ? "Logging..." : "Log"}</Button>
              <UIDialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </UIDialogClose>
            </UIDialogFooter>
          </form>
        </UIDialogContent>
      </UIDialog>

      {/* Edit Dialog */}
      <UIDialog open={editOpen} onOpenChange={setEditOpen}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Edit Project</UIDialogTitle>
          </UIDialogHeader>
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
            <UIDialogFooter className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={editLoading}>{editLoading ? "Saving..." : "Save"}</Button>
              <UIDialogClose asChild>
                <Button type="button" variant="secondary" className="flex-1">Cancel</Button>
              </UIDialogClose>
            </UIDialogFooter>
          </form>
        </UIDialogContent>
      </UIDialog>

      {/* Delete Confirmation Dialog */}
      <UIDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Delete Project</UIDialogTitle>
          </UIDialogHeader>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <UIDialogFooter className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
            <UIDialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </UIDialogClose>
          </UIDialogFooter>
        </UIDialogContent>
      </UIDialog>

      {/* Edit Role Dialog */}
      <UIDialog open={!!editRoleId} onOpenChange={closeEditRole}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Edit Role</UIDialogTitle>
          </UIDialogHeader>
          <form onSubmit={handleEditRole} className="space-y-4">
            <div>
              <Label htmlFor="edit-role-title">Role Title</Label>
              <Input id="edit-role-title" value={editRoleData.roleTitle} onChange={e => setEditRoleData({ ...editRoleData, roleTitle: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea id="edit-role-description" value={editRoleData.description} onChange={e => setEditRoleData({ ...editRoleData, description: e.target.value })} required />
            </div>
            {editRoleError && <p className="text-sm text-destructive mt-1">{editRoleError}</p>}
            {editRoleSuccess && <p className="text-sm text-green-600 mt-1">Role updated!</p>}
            <UIDialogFooter className="flex gap-2">
              <Button type="submit" disabled={editRoleLoading}>{editRoleLoading ? "Saving..." : "Save"}</Button>
              <UIDialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </UIDialogClose>
            </UIDialogFooter>
          </form>
        </UIDialogContent>
      </UIDialog>

      {/* Verify Role Dialog */}
      <UIDialog open={!!verifyRoleId} onOpenChange={closeVerifyRole}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Verify Role</UIDialogTitle>
          </UIDialogHeader>
          <form onSubmit={handleVerifyRole} className="space-y-4">
            <div>
              <Label htmlFor="verify-comment">Comment</Label>
              <Textarea id="verify-comment" value={verifyComment} onChange={e => setVerifyComment(e.target.value)} required />
            </div>
            {verifyError && <p className="text-sm text-destructive mt-1">{verifyError}</p>}
            {verifySuccess && <p className="text-sm text-green-600 mt-1">Verification submitted!</p>}
            <UIDialogFooter className="flex gap-2">
              <Button type="submit" disabled={verifyLoading}>{verifyLoading ? "Submitting..." : "Submit"}</Button>
              <UIDialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </UIDialogClose>
            </UIDialogFooter>
          </form>
        </UIDialogContent>
      </UIDialog>

      {/* View Verifications Dialog */}
      <UIDialog open={!!viewVerificationsRoleId} onOpenChange={closeViewVerifications}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Verifications</UIDialogTitle>
          </UIDialogHeader>
          {verificationsLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : verificationsError ? (
            <div className="text-destructive">{verificationsError}</div>
          ) : verifications.length === 0 ? (
            <div className="text-muted-foreground">No verifications yet.</div>
          ) : (
            <ul className="space-y-3">
              {verifications.map((v) => (
                <li key={v.id} className="p-3 rounded bg-muted">
                  <div className="font-medium">{v.verifier?.name || "Unknown"}</div>
                  <div className="text-sm text-muted-foreground">{v.comment}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v.createdAt ? new Date(v.createdAt).toLocaleString() : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </UIDialogContent>
      </UIDialog>
    </div>
  );
} 