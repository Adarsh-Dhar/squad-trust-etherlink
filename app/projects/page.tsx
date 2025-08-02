'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle, XCircle, Plus, FolderOpen, Send, X, ArrowLeft } from 'lucide-react';
import { createSquadTrustService, getSigner } from '@/lib/contract';
import { ethers } from 'ethers';
import { squadtrust_address } from '@/lib/contract/address';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'HIRING' | 'HIRED' | 'FINISHED' | 'FUNDS_DISTRIBUTED';
  creator: string;
  githubRepo?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
    members: Array<{
      user: {
        name?: string;
        walletAddress: string;
      };
    }>;
  };
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  funding: Array<{
    id: string;
    amount: number;
    currency: string;
  }>;
  roles: Array<{
    id: string;
    roleTitle: string;
    user: {
      name?: string;
      walletAddress: string;
    };
  }>;
  blockchainProjectId?: string;
}

interface Team {
  id: string;
  name: string;
  bio?: string;
  onchainTeamId?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedStake: '',
    teamExperience: '',
    quoteAmount: '',
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchProjects();
  }, [statusFilter]);

  const fetchTeam = async () => {
    try {
      // Try to get the current user's team
      const response = await fetch('/api/teams/my-teams');
      if (response.ok) {
        const teams = await response.json();
        if (teams.length > 0) {
          setTeam(teams[0]); // Use the first team
        }
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      // It's okay if no team is found - user can still browse projects
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (project: Project) => {
    if (!team) return 'Create Team First';
    if (!project.blockchainProjectId) return 'Project Not On-Chain';
    if (!team.onchainTeamId) return 'Create Team On-Chain';
    return 'Apply for Project';
  };

  const isApplicationReady = (project: Project) => {
    return project.status === 'HIRING' && 
           team && 
           project.blockchainProjectId && 
           team.onchainTeamId;
  };

  const handleApply = (project: Project) => {
    if (!team) {
      alert('You need to create a team first before applying for projects.');
      return;
    }
    
    if (!project.blockchainProjectId) {
      alert('This project has not been created on-chain yet. Please wait for the project to be fully initialized.');
      return;
    }
    
    if (!team.onchainTeamId) {
      alert('Your team has not been created on-chain yet. Please create your team on-chain first.');
      return;
    }
    
    setSelectedProject(project);
    setShowApplyDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedProject || !team) {
      alert('Please ensure you have a team before applying.');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Call the onchain applyForProject transaction
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      // Check user's balance before attempting transaction
      const balance = await signer.provider?.getBalance(await signer.getAddress());
      const stakeAmount = parseFloat(applicationData.proposedStake);
      const stakeWei = ethers.parseEther(stakeAmount.toString());
      
      if (balance && balance < stakeWei) {
        throw new Error(`Insufficient funds. You need at least ${applicationData.proposedStake} ETH to apply. Your balance: ${ethers.formatEther(balance)} ETH`);
      }

      // Use the correct contract address
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || squadtrust_address;
      const squadTrustService = createSquadTrustService(contractAddress, signer);
      
      // Use blockchain IDs instead of database IDs
      const blockchainProjectId = selectedProject.blockchainProjectId;
      const onchainTeamId = team.onchainTeamId;
      
      if (!blockchainProjectId) {
        throw new Error('This project has not been created on-chain yet. Please wait for the project to be fully initialized.');
      }
      
      if (!onchainTeamId) {
        throw new Error('Your team has not been created on-chain yet. Please create your team on-chain first.');
      }
      
      console.log('Submitting onchain application:', {
        projectId: blockchainProjectId,
        teamId: onchainTeamId,
        stake: applicationData.proposedStake
      });
      
      // Call the onchain applyForProject function
      await squadTrustService.applyForProject(
        blockchainProjectId,
        onchainTeamId,
        applicationData.proposedStake
      );

      console.log('Onchain transaction successful, now submitting to database...');

      // Step 2: Only after successful onchain transaction, add to database
      const response = await fetch(`/api/projects/${selectedProject.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter: applicationData.coverLetter,
          proposedStake: parseFloat(applicationData.proposedStake),
          teamExperience: applicationData.teamExperience,
          quoteAmount: parseFloat(applicationData.quoteAmount),
          deadline: applicationData.deadline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application to database');
      }

      // Reset form and close dialog
      setApplicationData({
        coverLetter: '',
        proposedStake: '',
        teamExperience: '',
        quoteAmount: '',
        deadline: '',
      });
      setShowApplyDialog(false);
      setSelectedProject(null);
      
      // Show success message
      alert('Application submitted successfully! Your stake has been locked on-chain.');
    } catch (err) {
      console.error('Error submitting application:', err);
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('No wallet connected')) {
          errorMessage = 'Please connect your wallet first.';
        } else if (err.message.includes('Insufficient funds')) {
          errorMessage = err.message;
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by the user.';
        } else if (err.message.includes('not been created on-chain')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FINISHED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'HIRING':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'HIRED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FUNDS_DISTRIBUTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINISHED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500/30';
      case 'HIRING':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/30';
      case 'HIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30';
      case 'FUNDS_DISTRIBUTED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalFunding = (funding: any[]) => {
    return funding.reduce((total, fund) => total + (fund.amount || 0), 0);
  };

  const getCompletedMilestones = (milestones: any[]) => {
    return milestones.filter(milestone => milestone.completed).length;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Projects</h3>
          <p className="text-destructive/80">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Discover <span className="text-primary">Projects</span></h1>
        <p className="text-muted-foreground text-lg">Explore blockchain projects with verified track records and transparent reputation scores.</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/projects/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Link>
        <Link
          href="/projects/my-projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          <FolderOpen className="w-4 h-4" />
          My Projects
        </Link>
        {team && (
          <Link
            href={`/teams/my-team/${team.id}/apply-projects`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <Send className="w-4 h-4" />
            Apply with Team
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border border-border">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setStatusFilter('HIRING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'HIRING'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setStatusFilter('HIRED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'HIRED'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setStatusFilter('FINISHED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'FINISHED'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('FUNDS_DISTRIBUTED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'FUNDS_DISTRIBUTED'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            Funds Distributed
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground">No projects match your current filters.</p>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-xl shadow-lg hover:shadow-xl hover:bg-accent/50 transition-all duration-200 overflow-hidden"
            >
              {/* Project Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(project.status)}
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Project Details */}
              <div className="p-6 space-y-4">
                {/* Team Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{project.team.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{project.team.members.length} members</span>
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                    {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {getCompletedMilestones(project.milestones)}/{project.milestones.length} milestones
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Funding */}
                {project.funding.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Funding:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {getTotalFunding(project.funding)} {project.funding[0]?.currency || 'ETH'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  {project.githubRepo && (
                    <a
                      href={project.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <GitBranch className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 text-center font-medium text-sm shadow-sm hover:shadow-md hover:scale-102"
                  >
                    View Details
                  </Link>
                  {project.status === 'HIRING' && (
                    <button
                      onClick={() => handleApply(project)}
                      disabled={!isApplicationReady(project)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 text-center font-medium text-sm ${
                        isApplicationReady(project)
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md hover:scale-102'
                          : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                      }`}
                    >
                      {getApplicationStatus(project)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {projects.length >= 50 && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              // Implement pagination
              console.log('Load more projects');
            }}
            className="px-6 py-2.5 bg-card text-foreground border border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-102"
          >
            Load More Projects
          </button>
        </div>
      )}

      {/* Apply Dialog */}
      {showApplyDialog && selectedProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Apply for Project</h2>
                <button
                  onClick={() => setShowApplyDialog(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-muted-foreground">
                Apply to join: <span className="font-semibold text-foreground">{selectedProject.name}</span>
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Cover Letter */}
              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-foreground mb-2">
                  Cover Letter *
                </label>
                <textarea
                  id="coverLetter"
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  placeholder="Explain why your team is the best fit for this project..."
                  className="w-full h-32 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              {/* Proposed Stake */}
              <div>
                <label htmlFor="proposedStake" className="block text-sm font-medium text-foreground mb-2">
                  Proposed Stake (ETH) *
                </label>
                <input
                  id="proposedStake"
                  type="number"
                  step="0.01"
                  min="0"
                  value={applicationData.proposedStake}
                  onChange={(e) => setApplicationData({ ...applicationData, proposedStake: e.target.value })}
                  placeholder="0.5"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              {/* Quote Amount */}
              <div>
                <label htmlFor="quoteAmount" className="block text-sm font-medium text-foreground mb-2">
                  Project Quote (ETH) *
                </label>
                <input
                  id="quoteAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={applicationData.quoteAmount}
                  onChange={(e) => setApplicationData({ ...applicationData, quoteAmount: e.target.value })}
                  placeholder="2.5"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Total amount quoted to complete the project</p>
              </div>

              {/* Team Experience */}
              <div>
                <label htmlFor="teamExperience" className="block text-sm font-medium text-foreground mb-2">
                  Team Experience
                </label>
                <textarea
                  id="teamExperience"
                  value={applicationData.teamExperience}
                  onChange={(e) => setApplicationData({ ...applicationData, teamExperience: e.target.value })}
                  placeholder="Describe your team's relevant experience and skills..."
                  className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-foreground mb-2">
                  Project Deadline *
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={applicationData.deadline}
                  onChange={(e) => setApplicationData({ ...applicationData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Expected completion date for the project</p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <button
                onClick={() => setShowApplyDialog(false)}
                className="px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-accent hover:border-primary/50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={submitting || !applicationData.coverLetter || !applicationData.proposedStake || !applicationData.quoteAmount || !applicationData.deadline}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium disabled:bg-muted disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-102"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
