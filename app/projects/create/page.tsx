'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, GitBranch, Globe, AlertCircle, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getSigner, createSquadTrustService } from '@/lib/contract';
import { squadtrust_address } from '@/lib/contract/address';

interface CreateProjectForm {
  title: string;
  description: string;
  githubRepo: string;
  liveUrl: string;
  minTeamStake: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { address: connectedWallet, isConnected, connectWallet, isConnecting } = useWallet();
  const [formData, setFormData] = useState<CreateProjectForm>({
    title: '',
    description: '',
    githubRepo: '',
    liveUrl: '',
    minTeamStake: '0.1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ projectId: string; txHash: string; onchainProjectId: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet to create a project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create project onchain first using user's wallet
      console.log('Starting onchain creation...');
      console.log('Wallet connected:', isConnected);
      console.log('Wallet address:', connectedWallet);
      
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Failed to get wallet signer');
      }
      
      console.log('Signer obtained successfully');
      
      const contractAddress = process.env.NEXT_PUBLIC_SQUADTRUST_CONTRACT_ADDRESS || squadtrust_address;
      console.log('Using contract address:', contractAddress);
      
      const squadTrustService = createSquadTrustService(contractAddress, signer);
      
      console.log('Creating project onchain:', { title: formData.title, minTeamStake: formData.minTeamStake });
      
      // Create project onchain first
      const result = await squadTrustService.createProject(formData.title, formData.minTeamStake);
      
      console.log('Project created onchain successfully:');
      console.log('- Project ID:', result.projectId);
      console.log('- Transaction Hash:', result.txHash);
      
      // Step 2: Create project in database with onchain data
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          blockchainProjectId: result.projectId,
          txHash: result.txHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project in database');
      }

      const project = await response.json();
      
      // Show success message with transaction hash
      setSuccess({
        projectId: project.id,
        txHash: result.txHash,
        onchainProjectId: result.projectId
      });
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 3000);
      
    } catch (err) {
      console.error('Error creating project:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(err instanceof Error ? err.message : 'An error occurred while creating the project');
    } finally {
      setLoading(false);
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Publish Your Project</h1>
            <p className="text-gray-600 text-lg">Share your project idea and let teams apply to work on it</p>
          </div>

          {/* Wallet Connection Required */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              You need to connect your wallet to create a project. This ensures you can manage your projects securely.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Publish Your Project</h1>
          <p className="text-gray-600 text-lg">Share your project idea and let teams apply to work on it</p>
          <p className="text-sm text-gray-500 mt-2">
            Connected wallet: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {connectedWallet?.slice(0, 6)}...{connectedWallet?.slice(-4)}
            </span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <div className="w-5 h-5 text-green-500 mt-0.5">✓</div>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Project Created Successfully!</h3>
                  <div className="text-sm text-green-600 mt-2 space-y-1">
                    <p><strong>Transaction Hash:</strong> <span className="font-mono text-xs">{success.txHash}</span></p>
                    <p><strong>Onchain Project ID:</strong> <span className="font-mono text-xs">{success.onchainProjectId}</span></p>
                    <p className="text-xs mt-2">Redirecting to project page...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your project title"
              />
            </div>

            {/* Project Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Describe your project idea, requirements, goals, and what you're looking for in a team..."
              />
            </div>

            {/* GitHub Repository */}
            <div>
              <label htmlFor="githubRepo" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="githubRepo"
                  name="githubRepo"
                  value={formData.githubRepo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://github.com/username/repository"
                />
                <GitBranch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Live URL */}
            <div>
              <label htmlFor="liveUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Live Demo URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="liveUrl"
                  name="liveUrl"
                  value={formData.liveUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://your-demo-site.com"
                />
                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Minimum Team Stake */}
            <div>
              <label htmlFor="minTeamStake" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Team Stake (ETH) *
              </label>
              <input
                type="number"
                id="minTeamStake"
                name="minTeamStake"
                value={formData.minTeamStake}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum amount teams must stake to apply for this project
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {loading ? 'Publishing Project...' : 'Publish Project'}
              </button>
              <Link
                href="/projects"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Publishing Your Project</h3>
          <p className="text-blue-800 text-sm">
            When you publish a project, teams will be able to discover it and apply to work on it. 
            Make sure to provide a clear description of your project requirements and what you're looking for in a team.
            You'll be able to review team applications and select the best fit for your project.
          </p>
        </div>
      </div>
    </div>
  );
}
