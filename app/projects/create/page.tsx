'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, GitBranch, Globe, AlertCircle, Wallet, Sparkles } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getSigner, createSquadTrustService } from '@/lib/contract';
import { squadtrust_address } from '@/lib/contract/address';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
            <div className="text-center animate-fade-in">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Publish Your <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Project</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Share your project idea and let teams apply to work on it
              </p>
            </div>
          </div>

          {/* Wallet Connection Required */}
          <div className="max-w-md mx-auto">
            <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Connect Your Wallet</CardTitle>
                <p className="text-muted-foreground mb-6">
                  You need to connect your wallet to create a project. This ensures you can manage your projects securely.
                </p>
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  size="lg"
                  className="w-full"
                >
                  {isConnecting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Publish Your <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Project</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Share your project idea and let teams apply to work on it
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <Wallet className="w-4 h-4" />
              Connected: <span className="font-mono">
                {connectedWallet?.slice(0, 6)}...{connectedWallet?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-destructive">Error</h3>
                      <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                    <div className="w-5 h-5 text-green-500 mt-0.5">✓</div>
                    <div>
                      <h3 className="text-sm font-medium text-green-700">Project Created Successfully!</h3>
                      <div className="text-sm text-green-600/80 mt-2 space-y-1">
                        <p><strong>Transaction Hash:</strong> <span className="font-mono text-xs">{success.txHash}</span></p>
                        <p><strong>Onchain Project ID:</strong> <span className="font-mono text-xs">{success.onchainProjectId}</span></p>
                        <p className="text-xs mt-2">Redirecting to project page...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-foreground">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
                    placeholder="Enter your project title"
                  />
                </div>

                {/* Project Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground">
                    Project Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background resize-none"
                    placeholder="Describe your project idea, requirements, goals, and what you're looking for in a team..."
                  />
                </div>

                {/* GitHub Repository */}
                <div className="space-y-2">
                  <label htmlFor="githubRepo" className="text-sm font-medium text-foreground">
                    GitHub Repository URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="githubRepo"
                      name="githubRepo"
                      value={formData.githubRepo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
                      placeholder="https://github.com/username/repository"
                    />
                    <GitBranch className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Live URL */}
                <div className="space-y-2">
                  <label htmlFor="liveUrl" className="text-sm font-medium text-foreground">
                    Live Demo URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="liveUrl"
                      name="liveUrl"
                      value={formData.liveUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
                      placeholder="https://your-demo-site.com"
                    />
                    <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Minimum Team Stake */}
                <div className="space-y-2">
                  <label htmlFor="minTeamStake" className="text-sm font-medium text-foreground">
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
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background"
                    placeholder="0.1"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum amount teams must stake to apply for this project
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {loading ? 'Publishing Project...' : 'Publish Project'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <Link href="/projects">
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="mt-8 border-0 bg-primary/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Publishing Your Project</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                When you publish a project, teams will be able to discover it and apply to work on it. 
                Make sure to provide a clear description of your project requirements and what you're looking for in a team.
                You'll be able to review team applications and select the best fit for your project.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
