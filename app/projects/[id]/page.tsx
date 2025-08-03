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
import { getSigner, createSquadTrustService, ProjectCreationService, isValidAddress } from "@/lib/contract";
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
        onchainTeamId?: string;
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
      // Check if user is connected
      if (!walletAddress) {
        throw new Error("Please connect your wallet to accept applications");
      }

      // Check if user is the project creator
      if (walletAddress.toLowerCase() !== project?.creator?.toLowerCase()) {
        throw new Error("Only the project creator can accept applications");
      }

      // Find the application to get team ID
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      const teamId = application.applicant.teams?.[0]?.team?.id;
      if (!teamId) {
        throw new Error("Team ID not found for this application");
      }

      const onchainTeamId = application.applicant.teams?.[0]?.team?.onchainTeamId;
      console.log('Team data:', application.applicant.teams?.[0]?.team);
      console.log('Database team ID:', teamId);
      console.log('Onchain team ID:', onchainTeamId);
      
      let finalOnchainTeamId: string;
      
      // Get signer and service once at the beginning
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      
      // If team doesn't have onchainTeamId, create it on-chain first
      if (!onchainTeamId) {
        console.log('Team does not have on-chain ID, creating team on-chain first...');
        
        try {
          // Get team details from the application
          const teamName = application.applicant.teams?.[0]?.team?.name || 'Team';
          
          // Use the applicant as the team member for now
          // In a real implementation, you would fetch all team members from the database
          const teamMembers = [application.applicant.walletAddress];
          
          console.log('Team members for on-chain creation:', teamMembers);
          
          console.log('Creating team on-chain:', {
            name: teamName,
            members: teamMembers
          });
          
          const { teamId: newOnchainTeamId, txHash } = await squadTrustService.createTeam(teamName, teamMembers);
          finalOnchainTeamId = newOnchainTeamId;
          
          console.log('✅ Team created on-chain successfully:', finalOnchainTeamId);
          console.log('Transaction hash:', txHash);
          
          // Update the team in database with the new onchainTeamId
          const updateTeamRes = await fetch(`/api/teams/${teamId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onchainTeamId: finalOnchainTeamId }),
          });
          
          if (!updateTeamRes.ok) {
            const errorData = await updateTeamRes.json();
            console.warn('Warning: Failed to update team with onchain ID in database:', errorData);
            // Continue anyway since the on-chain creation was successful
          }
          
        } catch (createError: any) {
          console.error('Error creating team on-chain:', createError);
          throw new Error(`Failed to create team on-chain: ${createError.message}`);
        }
      } else {
        finalOnchainTeamId = onchainTeamId;
      }

      // Validate that finalOnchainTeamId is a valid blockchain team ID
      // Note: Team IDs are bytes32 values, not Ethereum addresses
      if (!finalOnchainTeamId) {
        throw new Error("Invalid blockchain team ID. Team ID is required.");
      }

      // Check if project has blockchain ID
      if (!project?.blockchainProjectId) {
        throw new Error("Blockchain project ID not found for this project");
      }

      // Check if project is in HIRING status
      if (project.status !== "HIRING") {
        throw new Error("Project is not in HIRING status. Cannot accept applications.");
      }

      // Check if team has already applied on-chain
      const projectApplications = await squadTrustService.getProjectApplications(project.blockchainProjectId);
      const hasApplied = projectApplications.some((app: any) => 
        app.teamId === finalOnchainTeamId && app.applicant.toLowerCase() === application.applicant.walletAddress.toLowerCase()
      );
      
      if (!hasApplied) {
        // Instead of automatically applying, inform the user that the team needs to apply on-chain first
        const teamLeaderAddress = application.applicant.walletAddress;
        const proposedStake = application.proposedStake;
        
        throw new Error(
          `Team has not applied on-chain yet. The team leader (${teamLeaderAddress}) needs to apply on-chain first with their proposed stake of ${proposedStake} ETH. ` +
          `The team leader should use the "Apply On-Chain" button below their application to submit their stake.`
        );
      }

      // Verify team exists on-chain before hiring
      try {
        console.log(`Verifying team ${finalOnchainTeamId} exists on-chain...`);
        const teamOnChain = await squadTrustService.getTeam(finalOnchainTeamId);
        console.log('Team on-chain data:', teamOnChain);
        
        if (!teamOnChain.exists) {
          throw new Error("Team does not exist on-chain. Cannot hire this team.");
        }
        
        console.log(`Team ${finalOnchainTeamId} verified on-chain successfully`);
      } catch (teamError: any) {
        console.error('Error verifying team on-chain:', teamError);
        if (teamError.message.includes('invalid BytesLike value')) {
          throw new Error(`Invalid team ID format: ${finalOnchainTeamId}. Expected a valid blockchain address.`);
        }
        throw new Error(`Failed to verify team on-chain: ${teamError.message}`);
      }
      
      console.log(`Hiring team ${finalOnchainTeamId} for project ${project.blockchainProjectId} on-chain...`);
      await squadTrustService.hireTeam(project.blockchainProjectId, finalOnchainTeamId);
      console.log('Team hired successfully on-chain');
      
      // Only after successful on-chain transaction, update database
      const res = await fetch(`/api/projects/${projectId}/apply/${applicationId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept application in database");
      
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

      setSuccessMsg(`Team ${finalOnchainTeamId} hired successfully on-chain and application accepted!`);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e: any) {
      console.error('Error accepting application:', e);
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

  // Apply on-chain handler for team leaders
  const [applyingOnChainId, setApplyingOnChainId] = useState<string | null>(null);
  const [applyingOnChainError, setApplyingOnChainError] = useState<string | null>(null);
  const [applyingOnChainSuccess, setApplyingOnChainSuccess] = useState<string | null>(null);

  const handleApplyOnChain = async (application: Application) => {
    setApplyingOnChainId(application.id);
    setApplyingOnChainError(null);
    setApplyingOnChainSuccess(null);
    
    try {
      // Check if user is connected
      if (!walletAddress) {
        throw new Error("Please connect your wallet to apply on-chain");
      }

      // Check if user is the team leader (applicant)
      if (walletAddress.toLowerCase() !== application.applicant.walletAddress.toLowerCase()) {
        throw new Error("Only the team leader can apply on-chain for this application");
      }

      // Get team ID from the application
      const teamId = application.applicant.teams?.[0]?.team?.id;
      if (!teamId) {
        throw new Error("Team ID not found for this application");
      }

      // Check if team has onchainTeamId
      const onchainTeamId = application.applicant.teams?.[0]?.team?.onchainTeamId;
      if (!onchainTeamId) {
        throw new Error("Team does not have an on-chain ID. Team must be created on-chain first.");
      }

      // Check if project has blockchain ID
      if (!project?.blockchainProjectId) {
        throw new Error("Project does not have a blockchain ID");
      }

      // Get signer and create service
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Please connect your wallet");
      }

      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      
      // Check if team has already applied
      const projectApplications = await squadTrustService.getProjectApplications(project.blockchainProjectId);
      const hasApplied = projectApplications.some((app: any) => 
        app.teamId === onchainTeamId && app.applicant.toLowerCase() === walletAddress.toLowerCase()
      );
      
      if (hasApplied) {
        throw new Error("Team has already applied for this project on-chain");
      }

      // Apply for the project on-chain
      const txHash = await squadTrustService.applyForProject(
        project.blockchainProjectId,
        onchainTeamId,
        application.proposedStake.toString()
      );
      
      setApplyingOnChainSuccess(`Successfully applied on-chain! Transaction: ${txHash}`);
      
      // Refresh applications to update the status
      const applicationsRes = await fetch(`/api/projects/${projectId}/apply`);
      const applicationsData = await applicationsRes.json();
      if (applicationsRes.ok) {
        setApplications(applicationsData);
      }
      
    } catch (e: any) {
      console.error('Error applying on-chain:', e);
      setApplyingOnChainError(e.message || "Failed to apply on-chain");
    } finally {
      setApplyingOnChainId(null);
      // Clear success/error messages after 5 seconds
      setTimeout(() => {
        setApplyingOnChainSuccess(null);
        setApplyingOnChainError(null);
      }, 5000);
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

  const onAddFunding = async (data: any) => {
    setAddFundingLoading(true);
    setFundingError(null);
    
    try {
      // 1. Check if current user is the project creator
      if (!walletAddress) {
        throw new Error("Please connect your wallet to fund the project.");
      }
      
      if (walletAddress.toLowerCase() !== project?.creator?.toLowerCase()) {
        throw new Error("Only the project creator can fund this project. You are not the project creator.");
      }
      
      // 2. Check if blockchain project ID exists
      if (!project?.blockchainProjectId) {
        throw new Error("Blockchain project ID not found for this project.");
      }
      
      // 3. Get signer and create service
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      
      // 4. Verify project exists on blockchain and creator matches
      try {
        console.log('Verifying project on blockchain...');
        const blockchainProject = await squadTrustService.getProject(project.blockchainProjectId);
        console.log('Project exists on blockchain:', blockchainProject);
        
        // Check if the creator matches
        if (blockchainProject.creator.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new Error(`Project creator mismatch. Blockchain creator: ${blockchainProject.creator}, Current user: ${walletAddress}`);
        }
        
        console.log('Project verification passed, proceeding with funding...');
      } catch (blockchainError: any) {
        console.error('Project verification failed:', blockchainError);
        throw new Error(`Project not found on blockchain or verification failed: ${blockchainError.message}`);
      }
      
      // 5. Convert amount to ETH string for the contract
      const amountInEth = data.amount.toString();
      console.log(`Funding project ${project.blockchainProjectId} with ${amountInEth} ETH`);
      
      // 6. Call fundProject on-chain and get transaction hash
      const txHash = await squadTrustService.fundProject(project.blockchainProjectId, amountInEth);
      
      // 7. After successful on-chain transaction, insert into database
      const res = await fetch(`/api/projects/${projectId}/funding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Add blockchain transaction info
          blockchainProjectId: project.blockchainProjectId,
          onChainFunded: true,
          txHash: txHash,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to add funding to database");
      
      // 8. Update local state
      setFundings((prev) => [...prev, responseData]);
      resetFunding();
      setAddFundingOpen(false);
      
      // 9. Show success message
      setSuccessMsg(`Successfully funded project with ${amountInEth} ETH on-chain! Transaction: ${txHash}`);
      
    } catch (e: any) {
      console.error('Error in funding process:', e);
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

  // Log the number of projects on-chain when the page mounts
  useEffect(() => {
    async function logProjectsCount() {
      try {
        const signer = await getSigner();
        if (!signer) {
          console.log('No wallet connected, skipping getProjectsCount');
          return;
        }
        const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
        const count = await squadTrustService.getProjectsCount();
        console.log('On-chain projects count:', count);
      } catch (err) {
        console.error('Error getting on-chain projects count:', err);
      }
    }
    logProjectsCount();
  }, []);

  // Blockchain validation state
  const [blockchainValidation, setBlockchainValidation] = useState<{
    valid: boolean;
    projectData?: any;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const validateProjectOnLoad = async () => {
      if (!projectId || !project || !project.blockchainProjectId) return;

      setBlockchainValidation({ valid: false, error: "Validating..." });
      try {
        const signer = await getSigner();
        if (!signer) {
          throw new Error("Please connect your wallet to validate the project on-chain.");
        }
        const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);

        const projectOnChain = await squadTrustService.getProject(project.blockchainProjectId);
        setBlockchainValidation({
          valid: true,
          projectData: projectOnChain,
        });
      } catch (e: any) {
        setBlockchainValidation({
          valid: false,
          error: e.message || "Failed to validate project on-chain.",
        });
      }
    };

    validateProjectOnLoad();
  }, [projectId, project]);

  // Run diagnostics on page load
  useEffect(() => {
    runContractDiagnostics();
  }, []);

  // Add comprehensive diagnostic function
  const runContractDiagnostics = async () => {
    console.log("=== CONTRACT DIAGNOSTICS ===");
    
    try {
      const signer = await getSigner();
      if (!signer) {
        console.log("❌ No signer available");
        return;
      }
      
      console.log("✅ Signer available:", await signer.getAddress());
      
      // Check contract deployment
      const contractAddress = CONTRACT_ADDRESS;
      console.log("📋 Contract address:", contractAddress);
      
      // Check if contract exists
      const code = await signer.provider?.getCode(contractAddress);
      console.log("📦 Contract code exists:", code !== "0x");
      
      if (code === "0x") {
        console.log("❌ CONTRACT NOT DEPLOYED AT THIS ADDRESS!");
        return;
      }
      
      // Test basic contract functions
      const squadTrustService = createSquadTrustService(contractAddress, signer);
      
      try {
        const projectCount = await squadTrustService.getProjectsCount();
        console.log("📊 Projects count:", projectCount.toString());
      } catch (e: any) {
        console.log("❌ getProjectsCount failed:", e.message);
      }
      
      // Check if current project exists on blockchain
      if (project?.blockchainProjectId) {
        try {
          const projectOnChain = await squadTrustService.getProject(project.blockchainProjectId);
          console.log("✅ Project exists on blockchain:", projectOnChain);
        } catch (e: any) {
          console.log("❌ Project not found on blockchain:", e.message);
        }
      }
      
    } catch (e: any) {
      console.log("❌ Diagnostic failed:", e.message);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading project...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-destructive">{error}</div>;
  if (!project) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Project not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* DEBUG INFO */}
      <div className="mb-4 p-4 bg-yellow-100 text-yellow-900 rounded text-xs">
        <div className="flex justify-between items-center mb-2">
          <div><b>Debug Info:</b></div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={runContractDiagnostics}
            className="text-xs h-6 px-2"
          >
            Run Diagnostics
          </Button>
        </div>
        <div>Wallet Address: {walletAddress || 'Not connected'}</div>
        <div>Project Creator: {project?.creator || 'Unknown'}</div>
        <div>Is Project Creator: {walletAddress && project?.creator ? (walletAddress.toLowerCase() === project.creator.toLowerCase()).toString() : 'Unknown'}</div>
        <div>userDbRole: <pre>{JSON.stringify(userDbRole, null, 2)}</pre></div>
        <div>onChainUserRole: <pre>{JSON.stringify(onChainUserRole, null, 2)}</pre></div>
        <div>Blockchain Validation: <pre>{JSON.stringify(blockchainValidation, null, 2)}</pre></div>
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
                  {/* On-chain Application Notice */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">On-Chain Application Required</h4>
                        <p className="text-sm text-blue-700">
                          Before accepting an application, the team leader must apply on-chain with their proposed stake. 
                          Team leaders can use the "Apply On-Chain" button below their application to submit their stake directly. 
                          Only after the on-chain application is submitted can the project creator accept the application.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {applicationActionError && (
                    <div className="text-destructive text-sm mb-4">{applicationActionError}</div>
                  )}
                  {applyingOnChainError && (
                    <div className="text-destructive text-sm mb-4">{applyingOnChainError}</div>
                  )}
                  {applyingOnChainSuccess && (
                    <div className="text-green-600 text-sm mb-4">{applyingOnChainSuccess}</div>
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
                        
                        {/* Team Leader Apply On-Chain Button */}
                        {application.status === "PENDING" && project?.status === "HIRING" && 
                         walletAddress && walletAddress.toLowerCase() === application.applicant.walletAddress.toLowerCase() && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApplyOnChain(application)}
                            disabled={applyingOnChainId === application.id}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            {applyingOnChainId === application.id ? "Applying on-chain..." : "Apply On-Chain"}
                          </Button>
                        )}
                        
                        {application.status === "PENDING" && project?.status === "HIRING" && (
                          <div className="flex gap-2">
                            {walletAddress && walletAddress.toLowerCase() === project?.creator?.toLowerCase() ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAcceptApplication(application.id)}
                                disabled={acceptingApplicationId === application.id || rejectingApplicationId === application.id}
                              >
                                {acceptingApplicationId === application.id ? "Hiring on-chain..." : "Accept"}
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {walletAddress ? "Only project creator can accept" : "Connect wallet to accept"}
                              </div>
                            )}
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
              {walletAddress && walletAddress.toLowerCase() === project?.creator?.toLowerCase() ? (
                <Button size="sm" onClick={() => {
                  if (walletAddress && walletAddress.toLowerCase() === project?.creator?.toLowerCase()) {
                    setAddFundingOpen(true);
                  } else {
                    setFundingError("Only the project creator can fund this project.");
                  }
                }}>Fund Project</Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {walletAddress ? "Only the project creator can fund this project" : "Connect wallet to fund project"}
                </div>
              )}
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
            <UIDialogTitle>Fund Project On-Chain</UIDialogTitle>
          </UIDialogHeader>
          {walletAddress && walletAddress.toLowerCase() === project?.creator?.toLowerCase() ? (
            <form onSubmit={handleSubmitFunding(onAddFunding)} className="space-y-4">
              <div>
                <Label htmlFor="funding-amount">Amount (ETH)</Label>
                <Input id="funding-amount" type="number" step="any" {...registerFunding("amount", { required: "Amount is required", valueAsNumber: true })} />
                {fundingErrors.amount && <p className="text-sm text-destructive mt-1">{fundingErrors.amount.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="funding-currency">Currency</Label>
                <Input id="funding-currency" defaultValue="ETH" {...registerFunding("currency", { required: "Currency is required" })} />
                {fundingErrors.currency && <p className="text-sm text-destructive mt-1">{fundingErrors.currency.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="funding-source">Source (Optional)</Label>
                <Input id="funding-source" placeholder="e.g., Grant, Investment, etc." {...registerFunding("source")} />
              </div>
              <div>
                <Label htmlFor="funding-txHash">Transaction Hash (Auto-filled)</Label>
                <Input id="funding-txHash" placeholder="Will be filled after on-chain transaction" disabled {...registerFunding("txHash")} />
              </div>
              <UIDialogFooter className="flex gap-2">
                <Button type="submit" disabled={addFundingLoading || isSubmittingFunding}>{addFundingLoading ? "Funding on-chain..." : "Fund Project"}</Button>
                <UIDialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </UIDialogClose>
              </UIDialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-destructive text-center p-4">
                {walletAddress 
                  ? "Only the project creator can fund this project. You are not the project creator." 
                  : "Please connect your wallet to fund this project."
                }
              </div>
              <UIDialogFooter className="flex gap-2">
                <UIDialogClose asChild>
                  <Button type="button" variant="secondary">Close</Button>
                </UIDialogClose>
              </UIDialogFooter>
            </div>
          )}
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