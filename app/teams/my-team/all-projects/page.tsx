'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, GitBranch, ExternalLink, Clock, CheckCircle, AlertCircle, XCircle, Plus, FolderOpen, Send, X } from 'lucide-react';

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
}

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedStake: '',
    teamExperience: '',
    timeline: '',
    quoteAmount: '',
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

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

  const handleApply = (project: Project) => {
    setSelectedProject(project);
    setShowApplyDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/projects/${selectedProject.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter: applicationData.coverLetter,
          proposedStake: parseFloat(applicationData.proposedStake),
          teamExperience: applicationData.teamExperience,
          timeline: applicationData.timeline,
          quoteAmount: parseFloat(applicationData.quoteAmount),
          deadline: applicationData.deadline,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      // Reset form and close dialog
      setApplicationData({
        coverLetter: '',
        proposedStake: '',
        teamExperience: '',
        timeline: '',
        quoteAmount: '',
        deadline: '',
      });
      setShowApplyDialog(false);
      setSelectedProject(null);
      
      // Show success message (you can add a toast notification here)
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error submitting application:', err);
      alert('Failed to submit application. Please try again.');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Projects</h1>
          <p className="text-gray-600 text-lg">Browse all projects across the platform</p>
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
            <p className="text-gray-600">No projects match your current filters.</p>
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

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-gray-400">Created by:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                    </span>
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

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApply(project)}
                    disabled={project.status !== 'HIRING'}
                    className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors text-center font-medium flex items-center justify-center gap-2 ${
                      project.status === 'HIRING'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {project.status === 'HIRING' ? 'Apply for Project' : 'Not Hiring'}
                  </button>
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

      {/* Apply Dialog */}
      {showApplyDialog && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Apply for Project</h2>
                <button
                  onClick={() => setShowApplyDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Apply to join: <span className="font-semibold">{selectedProject.name}</span></p>
            </div>

            <div className="p-6 space-y-6">
              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter *
                </label>
                <textarea
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  placeholder="Explain why your team is the best fit for this project..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Proposed Stake */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Stake (ETH) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={applicationData.proposedStake}
                  onChange={(e) => setApplicationData({ ...applicationData, proposedStake: e.target.value })}
                  placeholder="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Quote Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Quote (ETH) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={applicationData.quoteAmount}
                  onChange={(e) => setApplicationData({ ...applicationData, quoteAmount: e.target.value })}
                  placeholder="2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Total amount quoted to complete the project</p>
              </div>

              {/* Team Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Experience
                </label>
                <textarea
                  value={applicationData.teamExperience}
                  onChange={(e) => setApplicationData({ ...applicationData, teamExperience: e.target.value })}
                  placeholder="Describe your team's relevant experience and skills..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Deadline *
                </label>
                <input
                  type="date"
                  value={applicationData.deadline}
                  onChange={(e) => setApplicationData({ ...applicationData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Expected completion date for the project</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowApplyDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={submitting || !applicationData.coverLetter || !applicationData.proposedStake || !applicationData.quoteAmount || !applicationData.deadline}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
