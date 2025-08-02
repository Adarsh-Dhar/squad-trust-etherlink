'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle, XCircle, Plus, FolderOpen } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string; // Changed from title to name to match the schema
  description: string;
  status: 'HIRING' | 'HIRED' | 'FINISHED' | 'FUNDS_DISTRIBUTED';
  creator: string; // Wallet address of the project creator
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
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { address: connectedWallet } = useWallet();

  useEffect(() => {
    if (connectedWallet) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [statusFilter, connectedWallet]);

  const fetchProjects = async () => {
    if (!connectedWallet) {
      setLoading(false);
      return;
    }

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
      
      // Add debugging
      console.log('Fetched projects data:', data);
      console.log('Connected wallet:', connectedWallet);
      
      // Filter projects to only show those created by the connected wallet
      const myProjects = data.filter((project: Project) => 
        project.creator.toLowerCase() === connectedWallet.toLowerCase()
      );
      
      console.log('My projects after filtering:', myProjects);
      
      setProjects(myProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'HIRING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FUNDS_DISTRIBUTED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!connectedWallet) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Please connect your wallet to view your projects.</p>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={fetchProjects}
            variant="destructive"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">My <span className="text-primary">Projects</span></h1>
        <p className="text-muted-foreground text-lg">Projects you've created across all teams</p>
        <p className="text-sm text-muted-foreground mt-2">
          Connected wallet: <span className="font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
            {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
          </span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/projects/create">
            <Plus className="w-4 h-4" />
            Create New Project
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/projects">
            <FolderOpen className="w-4 h-4" />
            Browse All Projects
          </Link>
        </Button>
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
            onClick={() => setStatusFilter('HIRED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 text-sm ${
              statusFilter === 'HIRED'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            Failed
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
          <p className="text-muted-foreground mb-4">You haven't created any projects yet.</p>
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="w-4 h-4" />
              Create Your First Project
            </Link>
          </Button>
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

                {/* View Project Button */}
                <Button asChild className="w-full mt-4">
                  <Link href={`/projects/${project.id}`}>
                    View Project
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {projects.length >= 50 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => {
            // Implement pagination
            console.log('Load more projects');
          }}>
            Load More Projects
          </Button>
        </div>
      )}
    </div>
  );
}
