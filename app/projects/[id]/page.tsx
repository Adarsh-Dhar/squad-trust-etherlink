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
import { MilestoneForm } from "@/components/milestones/MilestoneForm";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { getSigner, createSquadTrustService } from "@/lib/contract";
import { squadtrust_address as CONTRACT_ADDRESS } from "@/lib/contract/address";
import { useWallet } from "@/hooks/useWallet";

interface Project {
  id: string;
  name?: string; // Changed from title to name, made optional for migration
  description?: string;
  creator: string; // Wallet address of the project creator
  skillsRequired?: string; // New field, made optional for migration
  minimumStake?: number; // New field, made optional for migration
  fundingAmount?: number; // New field, made optional for migration
  status?: string; // Updated status enum
  blockchainProjectId?: string; // Added for on-chain completion
  teamId?: string; // Optional for backward compatibility
  githubRepo?: string; // Optional for backward compatibility
  liveUrl?: string; // Optional for backward compatibility
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

interface Application {
  id: string;
  applicantId: string;
  applicant: {
    id: string;
    name?: string;
    walletAddress: string;
    teams?: {
      team: {
        id: string;
        name: string;
      };
    }[];
  };
  coverLetter: string;
  proposedStake: number;
  quoteAmount: number;
  teamExperience?: string;
  teamScore?: number;
  status: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  deadline: string;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  // Add debugging
  console.log('ProjectDetailsPage rendered with projectId:', projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "", skillsRequired: "", minimumStake: 0, fundingAmount: 0 });
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
  const [onchainCompleteLoading, setOnchainCompleteLoading] = useState(false);
  const [onchainCompleteError, setOnchainCompleteError] = useState<string | null>(null);
  const [onchainCompleteSuccess, setOnchainCompleteSuccess] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [acceptingApplicationId, setAcceptingApplicationId] = useState<string | null>(null);
  const [rejectingApplicationId, setRejectingApplicationId] = useState<string | null>(null);
  const [applicationActionError, setApplicationActionError] = useState<string | null>(null);
  
  // Filtering and sorting state
  const [sortBy, setSortBy] = useState<'quoteAmount' | 'proposedStake' | 'teamScore' | 'deadline' | 'appliedAt'>('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMinQuote, setFilterMinQuote] = useState<string>('');
  const [filterMaxQuote, setFilterMaxQuote] = useState<string>('');
  const [filterMinStake, setFilterMinStake] = useState<string>('');
  const [filterMaxStake, setFilterMaxStake] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');

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
        console.log('Fetching project with ID:', projectId);
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        console.log('Project API response:', data);
        if (!res.ok) throw new Error(data.error || "Failed to fetch project");
        setProject(data);
      } catch (e: any) {
        console.error('Error fetching project:', e);
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

  // Fetch applications
  useEffect(() => {
    async function fetchApplications() {
      setApplicationsLoading(true);
      setApplicationsError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/apply`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch applications");
        setApplications(data);
      } catch (e: any) {
        setApplicationsError(e.message || "Failed to load applications");
      } finally {
        setApplicationsLoading(false);
      }
    }
    if (projectId) fetchApplications();
  }, [projectId]);

  // Accept application handler
  const handleAcceptApplication = async (applicationId: string) => {
    setAcceptingApplicationId(applicationId);
    setApplicationActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/apply/${applicationId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept application");
      
      // Refresh project and applications data
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      if (projectRes.ok) {
        setProject(projectData);
      }
      
      // Refresh applications
      const applicationsRes = await fetch(`/api/projects/${projectId}/apply`);
      const applicationsData = await applicationsRes.json();
      if (applicationsRes.ok) {
        setApplications(applicationsData);
      }
    } catch (e: any) {
      setApplicationActionError(e.message || "Failed to accept application");
    } finally {
      setAcceptingApplicationId(null);
    }
  };

  // Reject application handler
  const handleRejectApplication = async (applicationId: string) => {
    setRejectingApplicationId(applicationId);
    setApplicationActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/apply/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject application");
      
      // Remove the rejected application from the list
      setApplications((prev) => prev.filter(app => app.id !== applicationId));
    } catch (e: any) {
      setApplicationActionError(e.message || "Failed to reject application");
    } finally {
      setRejectingApplicationId(null);
    }
  };

  // Filter and sort applications
  const getFilteredAndSortedApplications = () => {
    let filtered = [...applications];

    // Apply filters
    if (filterMinQuote) {
      filtered = filtered.filter(app => app.quoteAmount >= parseFloat(filterMinQuote));
    }
    if (filterMaxQuote) {
      filtered = filtered.filter(app => app.quoteAmount <= parseFloat(filterMaxQuote));
    }
    if (filterMinStake) {
      filtered = filtered.filter(app => app.proposedStake >= parseFloat(filterMinStake));
    }
    if (filterMaxStake) {
      filtered = filtered.filter(app => app.proposedStake <= parseFloat(filterMaxStake));
    }
    if (filterMinScore) {
      filtered = filtered.filter(app => app.teamScore && app.teamScore >= parseFloat(filterMinScore));
    }
    if (filterMaxScore) {
      filtered = filtered.filter(app => app.teamScore && app.teamScore <= parseFloat(filterMaxScore));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'quoteAmount':
          aValue = a.quoteAmount;
          bValue = b.quoteAmount;
          break;
        case 'proposedStake':
          aValue = a.proposedStake;
          bValue = b.proposedStake;
          break;
        case 'teamScore':
          aValue = a.teamScore || 0;
          bValue = b.teamScore || 0;
          break;
        case 'deadline':
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
          break;
        case 'appliedAt':
        default:
          aValue = new Date(a.appliedAt).getTime();
          bValue = new Date(b.appliedAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const openEdit = () => {
    if (project) {
      setEditData({
        name: project.name || "",
        description: project.description || "",
        skillsRequired: project.skillsRequired || "",
        minimumStake: project.minimumStake || 0,
        fundingAmount: project.fundingAmount || 0,
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
      setProject((prev) => prev ? { ...prev, status: "HIRED" } : prev);
      setSuccessMsg("Project marked as hired!");
    } catch (e: any) {
      setError(e.message || "Failed to mark as completed");
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleCompleteOnchainAndDB = async () => {
    setOnchainCompleteLoading(true);
    setOnchainCompleteError(null);
    setOnchainCompleteSuccess(null);
    try {
      if (!project?.blockchainProjectId) {
        throw new Error("Blockchain project ID not found for this project.");
      }
      
      // 1. Complete on-chain FIRST - this is the primary action
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      
      // Call completeProject function from the contract
      await squadTrustService.completeProject(project.blockchainProjectId);
      
      // 2. Only after successful on-chain completion, update DB
      const res = await fetch(`/api/projects/${projectId}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as completed in DB");
      
      // 3. Update local state only after both operations succeed
      setProject((prev) => prev ? { ...prev, status: "HIRED" } : prev);
      setOnchainCompleteSuccess("Project marked as hired on-chain and in database!");
    } catch (e: any) {
      setOnchainCompleteError(e.message || "Failed to complete project");
    } finally {
      setOnchainCompleteLoading(false);
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

  // Withdraw stake state
  const [withdrawingRoleId, setWithdrawingRoleId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Withdraw stake handler
  const handleWithdrawStake = async (role: any) => {
    setWithdrawingRoleId(role.id);
    setWithdrawError(null);
    setWithdrawSuccess(null);
    try {
      if (!project?.blockchainProjectId) throw new Error("Blockchain project ID not found");
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      // TODO: Implement withdrawStake when contract supports it
      // await squadTrustService.withdrawStake(project.blockchainProjectId);
      setWithdrawSuccess("Stake withdrawal not yet implemented in contract");
    } catch (e: any) {
      setWithdrawError(e.message || "Failed to withdraw stake");
    } finally {
      setWithdrawingRoleId(null);
      setTimeout(() => setWithdrawSuccess(null), 2000);
    }
  };

  const { address: walletAddress } = useWallet();
  // On-chain user role state
  const [onChainUserRole, setOnChainUserRole] = useState<{ verified: boolean; stakeAmount: string } | null>(null);

  // Fetch on-chain role info for current user
  useEffect(() => {
    async function fetchOnChainUserRole() {
      if (!projectId || !walletAddress) {
        setOnChainUserRole(null);
        return;
      }
      try {
        const signer = await getSigner();
        if (!signer) return;
        const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
        // TODO: Implement getMemberRole when contract supports it
        // const role = await squadTrustService.getMemberRole(projectId, walletAddress);
        // if (role) {
        //   setOnChainUserRole({ verified: role.verified || false, stakeAmount: role.stakeAmount || "0" });
        // } else {
        //   setOnChainUserRole(null);
        // }
        
        // For now, set default values since the method doesn't exist
        setOnChainUserRole({ verified: false, stakeAmount: "0" });
      } catch {
        setOnChainUserRole(null);
      }
    }
    fetchOnChainUserRole();
  }, [projectId, walletAddress]);

  // Find the current user's role in the DB (for id, etc)
  const userDbRole = roles.find(
    (role) => role.user?.walletAddress?.toLowerCase() === walletAddress?.toLowerCase()
  );

  // Show button if on-chain role is verified and has positive stake
  const showWithdrawStake = !!userDbRole && onChainUserRole && onChainUserRole.verified && Number(onChainUserRole.stakeAmount) > 0;

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading project...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-destructive">{error}</div>;
  if (!project) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Project not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* DEBUG INFO */}
      <div className="mb-4 p-4 bg-yellow-100 text-yellow-900 rounded text-xs">
        <div><b>Debug Info:</b></div>
        <div>Wallet Address: {walletAddress || 'Not connected'}</div>
        <div>userDbRole: <pre>{JSON.stringify(userDbRole, null, 2)}</pre></div>
        <div>onChainUserRole: <pre>{JSON.stringify(onChainUserRole, null, 2)}</pre></div>
      </div>
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name || "Untitled Project"}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={
                project.status === "FINISHED" ? "default" : 
                project.status === "HIRED" ? "secondary" :
                project.status === "FUNDS_DISTRIBUTED" ? "default" :
                "secondary"
              }>
                {project.status || "HIRING"}
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
            {project.status === "HIRING" && (
              <Button size="sm" onClick={handleCompleteOnchainAndDB} disabled={onchainCompleteLoading} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md hover:from-green-600 hover:to-emerald-600 transition-all">
                <CheckCircle className="w-4 h-4 mr-2" />
                {onchainCompleteLoading ? "Completing..." : "Mark as Hired"}
              </Button>
            )}
            {/* Withdraw Stake Button for current user (on-chain check) */}
            {showWithdrawStake && userDbRole && (
              <Button
                size="sm"
                onClick={() => handleWithdrawStake(userDbRole)}
                disabled={withdrawingRoleId === userDbRole.id}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                {withdrawingRoleId === userDbRole.id ? "Withdrawing..." : `Withdraw Stake (${onChainUserRole.stakeAmount} ETH)`}
              </Button>
            )}
          </div>
        </div>
        
        {successMsg && <div className="text-green-600 text-sm mb-4">{successMsg}</div>}
        {error && <div className="text-destructive text-sm mb-4">{error}</div>}
        {onchainCompleteSuccess && <div className="text-green-600 text-sm mb-4">{onchainCompleteSuccess}</div>}
        {onchainCompleteError && <div className="text-destructive text-sm mb-4">{onchainCompleteError}</div>}
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
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
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Created by</Label>
                <p className="text-gray-600 mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                  {project.creator}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Skills Required</Label>
                <p className="text-gray-600 mt-1">{project.skillsRequired || "Not specified"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Minimum Stake</Label>
                  <p className="text-gray-600 mt-1">{project.minimumStake ? `${project.minimumStake} ETH` : "Not specified"}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Funding Amount</Label>
                  <p className="text-gray-600 mt-1">{project.fundingAmount ? `${project.fundingAmount} ETH` : "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filter and Sort Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Sort By</Label>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="appliedAt">Applied Date</option>
                      <option value="quoteAmount">Quote Amount</option>
                      <option value="proposedStake">Stake Amount</option>
                      <option value="teamScore">Team Score</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sort Order</Label>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Min Quote (ETH)</Label>
                    <Input 
                      type="number" 
                      value={filterMinQuote} 
                      onChange={(e) => setFilterMinQuote(e.target.value)}
                      placeholder="Min"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Quote (ETH)</Label>
                    <Input 
                      type="number" 
                      value={filterMaxQuote} 
                      onChange={(e) => setFilterMaxQuote(e.target.value)}
                      placeholder="Max"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Min Stake (ETH)</Label>
                    <Input 
                      type="number" 
                      value={filterMinStake} 
                      onChange={(e) => setFilterMinStake(e.target.value)}
                      placeholder="Min"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Stake (ETH)</Label>
                    <Input 
                      type="number" 
                      value={filterMaxStake} 
                      onChange={(e) => setFilterMaxStake(e.target.value)}
                      placeholder="Max"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium">Min Team Score</Label>
                    <Input 
                      type="number" 
                      value={filterMinScore} 
                      onChange={(e) => setFilterMinScore(e.target.value)}
                      placeholder="Min"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Max Team Score</Label>
                    <Input 
                      type="number" 
                      value={filterMaxScore} 
                      onChange={(e) => setFilterMaxScore(e.target.value)}
                      placeholder="Max"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterMinQuote('');
                      setFilterMaxQuote('');
                      setFilterMinStake('');
                      setFilterMaxStake('');
                      setFilterMinScore('');
                      setFilterMaxScore('');
                      setSortBy('appliedAt');
                      setSortOrder('desc');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              {applicationsLoading ? (
                <div className="text-muted-foreground">Loading applications...</div>
              ) : applicationsError ? (
                <div className="text-destructive">{applicationsError}</div>
              ) : applications.length === 0 ? (
                <div className="text-muted-foreground">No applications yet.</div>
              ) : (
                <div className="space-y-3">
                  {applicationActionError && (
                    <div className="text-destructive text-sm mb-4">{applicationActionError}</div>
                  )}
                  {getFilteredAndSortedApplications().map((application) => (
                    <div key={application.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="font-medium">{application.applicant.name || application.applicant.walletAddress}</div>
                        <div className="text-sm text-muted-foreground">{application.coverLetter}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Proposed Stake: <span className="font-semibold">{application.proposedStake} ETH</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quote Amount: <span className="font-semibold">{application.quoteAmount} ETH</span>
                        </div>
                        {application.teamExperience && (
                          <div className="text-xs text-muted-foreground">
                            Team Experience: {application.teamExperience}
                          </div>
                        )}
                        {application.teamScore && (
                          <div className="text-xs text-muted-foreground">
                            Team Score: {application.teamScore}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Deadline: {new Date(application.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2 mt-2 md:mt-0">
                        <Badge variant={application.status === "ACCEPTED" ? "default" : application.status === "REJECTED" ? "destructive" : "secondary"}>
                          {application.status}
                        </Badge>
                        {application.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAcceptApplication(application.id)}
                              disabled={acceptingApplicationId === application.id || rejectingApplicationId === application.id}
                            >
                              {acceptingApplicationId === application.id ? "Accepting..." : "Accept"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectApplication(application.id)}
                              disabled={rejectingApplicationId === application.id || acceptingApplicationId === application.id}
                            >
                              {rejectingApplicationId === application.id ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const teamId = application.applicant.teams?.[0]?.team?.id;
                            if (teamId) {
                              router.push(`/teams/${teamId}`);
                            }
                          }}
                          disabled={!application.applicant.teams?.[0]?.team?.id}
                          className="mt-2"
                        >
                          View Team Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onComplete={async (milestoneId, data) => {
                        await markMilestoneComplete(milestoneId);
                      }}
                    />
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
              <Button size="sm" onClick={() => setAddFundingOpen(true)}>Create Funding</Button>
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
      </Tabs>

      {/* Add Milestone Dialog */}
      <UIDialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
        <UIDialogContent>
          <UIDialogHeader>
            <UIDialogTitle>Add Milestone</UIDialogTitle>
          </UIDialogHeader>
          <MilestoneForm
            projectId={projectId}
            onSubmit={onAddMilestone}
            onCancel={() => setAddMilestoneOpen(false)}
            loading={addMilestoneLoading || isSubmittingMilestone}
          />
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
              <Input id="title" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="skillsRequired">Skills Required</Label>
              <Input id="skillsRequired" value={editData.skillsRequired} onChange={e => setEditData({ ...editData, skillsRequired: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="minimumStake">Minimum Stake</Label>
              <Input id="minimumStake" type="number" value={editData.minimumStake} onChange={e => setEditData({ ...editData, minimumStake: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="fundingAmount">Funding Amount</Label>
              <Input id="fundingAmount" type="number" value={editData.fundingAmount} onChange={e => setEditData({ ...editData, fundingAmount: Number(e.target.value) })} />
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