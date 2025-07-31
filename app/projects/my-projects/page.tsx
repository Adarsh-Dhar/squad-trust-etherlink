'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to view your projects.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Projects</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600 text-lg">Projects you've created across all teams</p>
          <p className="text-sm text-gray-500 mt-2">
            Connected wallet: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
            </span>
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setStatusFilter('HIRING')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'HIRING'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setStatusFilter('FINISHED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'FINISHED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('HIRED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'HIRED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Failed
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">You haven't created any projects yet.</p>
            <Link
              href="/projects/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Project Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="p-6 space-y-4">
                  {/* Team Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{project.team.name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{project.team.members.length} members</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {getCompletedMilestones(project.milestones)}/{project.milestones.length} milestones
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Funding */}
                  {project.funding.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Funding:</span>
                        <span className="font-semibold text-green-600">
                          {getTotalFunding(project.funding)} {project.funding[0]?.currency || 'ETH'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {project.githubRepo && (
                      <a
                        href={project.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}
                  </div>

                  {/* View Project Button */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                    onClick={() => {
                      console.log('View Project clicked for project:', project.id);
                      console.log('Routing to:', `/projects/${project.id}`);
                    }}
                  >
                    View Project
                  </Link>
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
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Load More Projects
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
