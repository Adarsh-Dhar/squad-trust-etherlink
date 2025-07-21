"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, Clock, DollarSign, Award, Users, FolderOpen, LogOut } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { CreateProjectForm } from "@/components/create-project-form";
import { useSession } from "next-auth/react";
import { useWallet } from "@/hooks/useWallet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClaimRoleButton } from "@/components/ui/claim-role-button";
import { VerifyRoleButton } from "@/components/ui/verify-role-button";
import { createSquadTrustService, getSigner } from "@/lib/contract";
import { address as CONTRACT_ADDRESS } from "@/lib/contract/address";
import { getBytes } from "ethers";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  blockchainProjectId?: string; // Blockchain project ID from smart contract
  milestones: any[];
  funding: any[];
}

interface Team {
  id: string;
  name: string;
  bio: string | null;
  website: string | null;
  createdAt: string;
  members: TeamMember[];
  projects: Project[];
  credibility: {
    score: number;
    lastUpdated: string;
    details: any;
  } | null;
}

export function TeamProfile({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [addFundingOpen, setAddFundingOpen] = useState(false);
  const [addFundingLoading, setAddFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [fundingSuccess, setFundingSuccess] = useState<string | null>(null);
  const { register: registerFunding, handleSubmit: handleSubmitFunding, reset: resetFunding, formState: { errors: fundingErrors, isSubmitting: isSubmittingFunding } } = useForm();
  const { data: session } = useSession();
  const { address } = useWallet();
  const router = useRouter();

  // Add per-project completion state
  const [completingProjectId, setCompletingProjectId] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState<string | null>(null);

  // Per-project user role/stake state
  const [userProjectRoles, setUserProjectRoles] = useState<Record<string, { stakeAmount: string, verified: boolean }>>({});
  const [withdrawingProjectId, setWithdrawingProjectId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }
        
        const teamData = await response.json();
        setTeam(teamData);
        
        console.log('Team data loaded:', {
          teamId,
          teamName: teamData.name,
          members: teamData.members.map((m: any) => ({
            id: m.id,
            walletAddress: m.user.walletAddress,
            name: m.user.name,
            role: m.role
          })),
          currentAddress: address,
          projects: teamData.projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            blockchainProjectId: p.blockchainProjectId
          }))
        });

        // Fetch all projects from blockchain
        try {
          const signer = await getSigner();
          if (signer) {
            const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || "0x0b306bf915c4d645ff596e518faf3f9669b97016";
            const squadTrustService = createSquadTrustService(contractAddress, signer);
            
            // console.log('Fetching all projects from blockchain...');
            const allProjects = await squadTrustService.getAllProjects();
            if (process.env.NODE_ENV === 'development') {
              console.log('All projects from blockchain:', allProjects);
            }
            
            // Get and log project count
            const projectCount = await squadTrustService.getProjectCount();
            if (process.env.NODE_ENV === 'development') {
              console.log('Total project count from blockchain:', projectCount);
            }
            
            // Log detailed information for each project
            for (const projectId of allProjects) {
              try {
                const projectDetails = await squadTrustService.getProject(projectId);
                // console.log(`Project ${projectId} details:`, projectDetails);
                
                // Get project members
                const projectMembers = await squadTrustService.getProjectMembers(projectId);
                // console.log(`Project ${projectId} members:`, projectMembers);
                
                // Get credibility scores for members
                for (const member of projectMembers) {
                  try {
                    const credibilityScore = await squadTrustService.getCredibilityScore(member);
                    // console.log(`Member ${member} credibility score:`, credibilityScore);
                  } catch (error) {
                    // console.log(`Could not get credibility score for member ${member}:`, error);
                  }
                }
              } catch (error) {
                // console.log(`Could not get details for project ${projectId}:`, error);
              }
            }
          } else {
            // console.log('No signer available, skipping blockchain project fetch');
          }
        } catch (blockchainError) {
          console.error('Error fetching projects from blockchain:', blockchainError);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [teamId, address]);

  // Log member detection when team or address changes
  useEffect(() => {
    if (team && address) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Member detection result:', {
          address,
          teamId: team.id,
          teamName: team.name,
          isMember: isCurrentUserMember(),
          totalMembers: team.members.length
        });
      }
    }
  }, [team, address]);

  // Fetch user role/stake for each project on mount or address/team change
  useEffect(() => {
    if (!address || !team) return;
    const fetchRoles = async () => {
      const signer = await getSigner();
      if (!signer) return;
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      const updates: Record<string, { stakeAmount: string, verified: boolean }> = {};
      await Promise.all(team.projects.map(async (project) => {
        // Only call if blockchainProjectId is a valid 0x-prefixed 32-byte hex string
        if (!project.blockchainProjectId || project.blockchainProjectId.length !== 66) return;
        try {
          const role = await squadTrustService.getMemberRole(getBytes(project.blockchainProjectId), address);
          if (role) {
            updates[project.id] = { stakeAmount: role.stakeAmount, verified: role.verified };
          }
        } catch (err: any) {
          // Suppress 'could not decode result data' error (user has no on-chain role)
          if (
            err?.code === 'BAD_DATA' &&
            err?.message?.includes('could not decode result data')
          ) {
            // Do not log, this is expected
            return;
          } else {
            // Log unexpected errors only
            console.error('Error getting member role:', err);
          }
        }
      }));
      setUserProjectRoles(updates);
    };
    fetchRoles();
  }, [address, team]);

  // Withdraw stake handler for project
  const handleWithdrawStake = async (project: Project) => {
    setWithdrawingProjectId(project.id);
    setWithdrawError(null);
    setWithdrawSuccess(null);
    try {
      if (!project.blockchainProjectId) throw new Error("Blockchain project ID not found");
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      await squadTrustService.withdrawStake(project.blockchainProjectId);
      setWithdrawSuccess("Stake withdrawn successfully!");
      // Optionally, refetch role info
      setUserProjectRoles((prev) => ({ ...prev, [project.id]: { ...prev[project.id], stakeAmount: "0" } }));
    } catch (e: any) {
      setWithdrawError(e.message || "Failed to withdraw stake");
    } finally {
      setWithdrawingProjectId(null);
      setTimeout(() => setWithdrawSuccess(null), 2000);
    }
  };

  // Check if current user is a member of this team
  const isCurrentUserMember = () => {
    if (!address || !team) {
      // console.log('Member check failed - missing address or team:', { address, team: !!team });
      return false;
    }
    
    // Normalize the current user's address
    const normalizedUserAddress = address.toLowerCase();
    
    // console.log('=== DETAILED MEMBER CHECK ===');
    // console.log('Current user address:', address);
    // console.log('Normalized user address:', normalizedUserAddress);
    // console.log('Team ID:', team.id);
    // console.log('Team name:', team.name);
    // console.log('Total members:', team.members.length);
    
    // Check if user is in the team members list
    const isMember = team.members.some((member, index) => {
      const normalizedMemberAddress = member.user.walletAddress.toLowerCase();
      const matches = normalizedMemberAddress === normalizedUserAddress;
      
      // console.log(`Member ${index + 1}:`);
      // console.log(`  - Wallet: ${member.user.walletAddress}`);
      // console.log(`  - Normalized: ${normalizedMemberAddress}`);
      // console.log(`  - Name: ${member.user.name}`);
      // console.log(`  - Role: ${member.role}`);
      // console.log(`  - Matches current user: ${matches}`);
      
      return matches;
    });
    
    // console.log('=== FINAL RESULT ===');
    // console.log('Is member:', isMember);
    // console.log('========================');
    
    return isMember;
  };

  // Get current user's role in the team
  const getCurrentUserRole = () => {
    if (!address || !team) return null;
    
    const normalizedUserAddress = address.toLowerCase();
    const member = team.members.find(member => {
      const normalizedMemberAddress = member.user.walletAddress.toLowerCase();
      return normalizedMemberAddress === normalizedUserAddress;
    });
    
    return member?.role || null;
  };

  // Join team handler
  const handleJoin = async () => {
    if (!address) {
      setError("Please connect your wallet to join teams.");
      return;
    }

    // Log the connected wallet address and members list
    console.log('Join Team Clicked:', {
      connectedWalletAddress: address,
      teamId: teamId,
      teamName: team?.name,
      currentMembers: team?.members.map(m => ({
        id: m.id,
        walletAddress: m.user.walletAddress,
        name: m.user.name,
        role: m.role
      })),
      totalMembers: team?.members.length
    });

    setJoining(true);
    setError(null);
    try {
      // First, get the user by wallet address
      const userRes = await fetch(`/api/users/wallet/${address}`);
      if (!userRes.ok) {
        throw new Error("User not found");
      }
      const user = await userRes.json();

      console.log('User found:', user);

      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: "MEMBER" }), // Ensure this is the correct enum value
      });

      if (!res.ok) {
        const err = await res.json();
        console.log('Join team response error:', err);
        if (res.status === 409) {
          // User is already a member, refresh team data
          console.log('User is already a member, refreshing team data...');
          const teamRes = await fetch(`/api/teams/${teamId}`);
          if (teamRes.ok) {
            const updatedTeam = await teamRes.json();
            setTeam(updatedTeam);
            console.log('Team data refreshed:', updatedTeam);
          }
        } else {
          throw new Error(err.error || "Failed to join team");
        }
      } else {
        // Refresh team data to show updated member list
        console.log('Successfully joined team, refreshing data...');
        const teamRes = await fetch(`/api/teams/${teamId}`);
        if (teamRes.ok) {
          const updatedTeam = await teamRes.json();
          setTeam(updatedTeam);
          console.log('Updated team data after join:', updatedTeam);
        }
      }
    } catch (e: any) {
      console.error('Join team error:', e);
      setError(e.message || "Failed to join team");
    } finally {
      setJoining(false);
    }
  };

  // Leave team handler
  const handleLeave = async () => {
    if (!address) {
      setError("Please connect your wallet to leave teams.");
      return;
    }

    setLeaving(true);
    setError(null);
    try {
      // First, get the user by wallet address
      const userRes = await fetch(`/api/users/wallet/${address}`);
      if (!userRes.ok) {
        throw new Error("User not found");
      }
      const user = await userRes.json();

      const res = await fetch(`/api/teams/${teamId}/members/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to leave team");
      }

      // Check if team was deleted by trying to fetch it
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (!teamRes.ok) {
        // Team was deleted, redirect to teams directory
        window.location.href = '/teams';
        return;
      }

      // Team still exists, update team data
      const updatedTeam = await teamRes.json();
      setTeam(updatedTeam);
    } catch (e: any) {
      setError(e.message || "Failed to leave team");
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  // Add funding handler
  const onAddFunding = async (data: any) => {
    setAddFundingLoading(true);
    setFundingError(null);
    setFundingSuccess(null);
    try {
      // 1. Onchain confirmMilestone
      const signer = await getSigner();
      if (!signer) throw new Error('Please connect your wallet');
      const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || "0x0b306bf915c4d645ff596e518faf3f9669b97016";
      const squadTrustService = createSquadTrustService(contractAddress, signer);
      // Find the selected project and get its blockchainProjectId
      const selectedProject = team?.projects.find(p => p.id === data.projectId);
      if (!selectedProject || !selectedProject.blockchainProjectId) {
        throw new Error('Blockchain project ID not found for selected project');
      }
      const milestoneId = Date.now();
      await squadTrustService.confirmMilestone(selectedProject.blockchainProjectId, milestoneId, data.description || "Funding confirmed");

      // 2. POST to the selected project's funding endpoint
      const res = await fetch(`/api/projects/${data.projectId}/funding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          source: data.source,
          txHash: data.txHash,
          description: data.description,
          milestoneId,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to add funding");
      setFundingSuccess("Funding added successfully!");
      resetFunding();
      setAddFundingOpen(false);
      // Refresh team data
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (teamRes.ok) {
        setTeam(await teamRes.json());
      }
    } catch (e: any) {
      setFundingError(e.message || "Failed to add funding");
    } finally {
      setAddFundingLoading(false);
    }
  };

  // Complete project handler
  const handleCompleteProject = async (project: Project) => {
    setCompletingProjectId(project.id);
    setCompleteError(null);
    setCompleteSuccess(null);
    try {
      console.log("userProjectRoles[project.id]", userProjectRoles[project.id]);
      if (!project.blockchainProjectId) throw new Error("Blockchain project ID not found");
      const signer = await getSigner();
      if (!signer) throw new Error("Please connect your wallet");
      const squadTrustService = createSquadTrustService(CONTRACT_ADDRESS, signer);
      await squadTrustService.completeProject(project.blockchainProjectId);
      // Update DB
      const res = await fetch(`/api/projects/${project.id}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as completed in DB");
      // Refresh team data
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (teamRes.ok) {
        setTeam(await teamRes.json());
      }
      setCompleteSuccess("Project completed on-chain and in database!");
    } catch (e: any) {
      setCompleteError(e.message || "Failed to complete project");
    } finally {
      setCompletingProjectId(null);
      setTimeout(() => setCompleteSuccess(null), 2000);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-blue-500 to-cyan-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
  }

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { variant: 'default' as const, className: 'bg-green-500', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
      case 'ONGOING':
        return { variant: 'secondary' as const, className: '', icon: <Clock className="h-3 w-3 mr-1" /> };
      case 'FAILED':
        return { variant: 'destructive' as const, className: '', icon: <Clock className="h-3 w-3 mr-1" /> };
      default:
        return { variant: 'secondary' as const, className: '', icon: <Clock className="h-3 w-3 mr-1" /> };
    }
  }

  const calculateTotalFunding = (projects: Project[]) => {
    return projects.reduce((total, project) => {
      const projectFunding = project.funding.reduce((sum: number, fund: any) => sum + fund.amount, 0);
      return total + projectFunding;
    }, 0);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-muted-foreground">Loading team data...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-red-500">
          {error || 'Failed to load team data'}
        </div>
      </div>
    );
  }

  const totalFunding = calculateTotalFunding(team.projects);
  const trustScore = team.credibility?.score || 0;
  const isMember = isCurrentUserMember();
  const userRole = getCurrentUserRole();

  // Debug logging
  console.log('Team Profile Debug:', {
    address,
    isConnected: !!address,
    teamMembers: team.members.map(m => ({ 
      walletAddress: m.user.walletAddress, 
      role: m.role 
    })),
    isMember,
    userRole
  });

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-2xl font-bold mb-4">Connect Your Wallet</div>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to view team details and join/leave teams.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Team Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-6xl">🚀</div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
                <p className="text-muted-foreground">Founded in {formatDate(team.createdAt)}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
              {team.bio || "No description available"}
            </p>
            {team.website && (
              <div className="mb-6">
                <a 
                  href={team.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {team.website}
                </a>
              </div>
            )}

            {/* Join/Leave Button */}
            <div className="mb-6">
              {!isMember ? (
                <Button 
                  onClick={handleJoin} 
                  disabled={joining}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  {joining ? "Joining..." : "Join Team"}
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {userRole === 'ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                  <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={leaving}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {leaving ? "Leaving..." : "Leave Team"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave Team</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to leave {team.name}? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleLeave}>
                          Leave Team
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Trust Score Card */}
          <Card className="w-full lg:w-80 animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary mb-2">{Math.round(trustScore * 100)}/100</div>
                <Progress value={trustScore * 100} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{team.projects.length}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{team.members.length}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">${totalFunding.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Raised</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="animate-slide-up">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="funding">Funding History</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        {/* Projects */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Projects</h2>
            {isMember && userRole === 'ADMIN' && (
              <Button 
                variant="default" 
                onClick={() => router.push(`/teams/${teamId}/projects`)}
              >
                Create Project
              </Button>
            )}
          </div>
          <div className="grid gap-6">
            {team.projects.length === 0 ? (
              <Card className="animate-slide-up">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No projects yet. Create your first project to get started!</p>
                </CardContent>
              </Card>
            ) : (
              team.projects.map((project, index) => {
                const statusBadge = getProjectStatusBadge(project.status);
                const projectFunding = project.funding.reduce((sum: number, fund: any) => sum + fund.amount, 0);
                
                return (
                  <Card key={project.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{project.title}</h3>
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                              {statusBadge.icon}
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-4">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {project.milestones.map((milestone) => (
                              <Badge key={milestone.id} variant="outline" className="text-xs">
                                {milestone.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary mb-1">
                            ${projectFunding.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Role Management</h4>
                            {isMember && userRole === 'ADMIN' && (
                              <div className="flex gap-2">
                                {team.members
                                  .filter(member => member.role !== 'ADMIN')
                                  .map((member) => (
                                    <VerifyRoleButton
                                      key={`${project.id}-${member.id}`}
                                      projectId={project.id}
                                      blockchainProjectId={project.blockchainProjectId}
                                      memberAddress={member.user.walletAddress}
                                      memberName={member.user.name}
                                      variant="outline"
                                      size="sm"
                                    />
                                  ))}
                              </div>
                            )}
                          </div>
                          <ClaimRoleButton 
                            projectId={project.id} 
                            blockchainProjectId={project.blockchainProjectId}
                          />
                          {/* Complete Project Button for Admins */}
                          {isMember && userRole === 'ADMIN' && project.status !== 'COMPLETED' && project.blockchainProjectId && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteProject(project)}
                              disabled={completingProjectId === project.id}
                              className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md hover:from-green-600 hover:to-emerald-600 transition-all"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {completingProjectId === project.id ? "Completing..." : "Complete Project (On-chain)"}
                            </Button>
                          )}
                          {/* Show per-project error/success */}
                          {completeError && completingProjectId === project.id && (
                            <div className="text-destructive text-xs mt-2">{completeError}</div>
                          )}
                          {completeSuccess && completingProjectId === project.id && (
                            <div className="text-green-500 text-xs mt-2">{completeSuccess}</div>
                          )}
                          {/* Withdraw Stake Button for current user */}

                            {userProjectRoles[project.id] && (
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawStake(project)}
                                disabled={withdrawingProjectId === project.id}
                                className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:from-blue-600 hover:to-cyan-600 transition-all"
                              >
                                {withdrawingProjectId === project.id
                                  ? "Withdrawing..."
                                  : `Withdraw Stake (${userProjectRoles[project.id].stakeAmount} ETH)`}
                              </Button>
                            )}
                          
                          {withdrawError && withdrawingProjectId === project.id && (
                            <div className="text-destructive text-xs mt-2">{withdrawError}</div>
                          )}
                          {withdrawSuccess && withdrawingProjectId === project.id && (
                            <div className="text-green-500 text-xs mt-2">{withdrawSuccess}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Funding History */}
        <TabsContent value="funding" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Funding History</h2>
            {isMember && userRole === 'ADMIN' && (
              <Button onClick={() => setAddFundingOpen(true)}>
                Create Funding
              </Button>
            )}
          </div>
          <div className="grid gap-6">
            {team.projects.flatMap(project => project.funding).length === 0 ? (
              <Card className="animate-slide-up">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No funding history available.</p>
                </CardContent>
              </Card>
            ) : (
              team.projects.flatMap(project => 
                project.funding.map(fund => ({
                  ...fund,
                  projectTitle: project.title,
                  projectId: project.id
                }))
              ).map((funding, index) => (
                <Card key={funding.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-semibold">{funding.source}</h3>
                        </div>
                        <p className="text-muted-foreground">Project: {funding.projectTitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          ${funding.amount.toLocaleString()} {funding.currency}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(funding.receivedAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* Create Funding Dialog */}
          <Dialog open={addFundingOpen} onOpenChange={setAddFundingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Funding</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitFunding(onAddFunding)} className="space-y-4">
                <div>
                  <Label htmlFor="funding-project">Project</Label>
                  <select id="funding-project" {...registerFunding("projectId", { required: "Project is required" })} className="w-full border rounded p-2">
                    <option value="">Select a project</option>
                    {team.projects.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                  {fundingErrors.projectId && <p className="text-sm text-destructive mt-1">{fundingErrors.projectId.message as string}</p>}
                </div>
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
                <DialogFooter className="flex gap-2">
                  <Button type="submit" disabled={addFundingLoading || isSubmittingFunding}>{addFundingLoading ? "Creating..." : "Create"}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
                {fundingError && <p className="text-sm text-destructive mt-2">{fundingError}</p>}
                {fundingSuccess && <p className="text-sm text-green-600 mt-2">{fundingSuccess}</p>}
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Contributors */}
        <TabsContent value="contributors" className="space-y-6">
          <div className="grid gap-4">
            {team.members.length === 0 ? (
              <Card className="animate-slide-up">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet.</p>
                </CardContent>
              </Card>
            ) : (
              team.members.map((member, index) => (
                <Card key={member.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                          {member.user.name
                            ? member.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : member.user.walletAddress.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              {member.user.name || `${member.user.walletAddress.slice(0, 6)}...${member.user.walletAddress.slice(-4)}`}
                            </h3>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-muted-foreground">Joined {formatDate(member.joinedAt)}</div>
                        {/* Show VerifyRoleButton for team admins and project creators */}
                        {isMember && userRole === 'ADMIN' && member.role !== 'ADMIN' && (
                          <div className="flex gap-2">
                            {team.projects.map((project) => (
                              <VerifyRoleButton
                                key={`${member.id}-${project.id}`}
                                projectId={project.id}
                                blockchainProjectId={project.blockchainProjectId}
                                memberAddress={member.user.walletAddress}
                                memberName={member.user.name}
                                variant="outline"
                                size="sm"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
