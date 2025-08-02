'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Plus,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  bio: string | null;
  website: string | null;
  tags: string[];
  createdAt: string;
  members: Array<{
    id: string;
    role: 'ADMIN' | 'MEMBER';
    user: {
      id: string;
      walletAddress: string;
      name: string | null;
    };
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    funding: Array<{
      amount: number;
    }>;
    milestones: Array<{
      id: string;
      title: string;
      status: string;
    }>;
  }>;
  credibility: {
    score: number;
  } | null;
}

export default function MyTeamPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyTeams() {
      if (status === 'loading') return;
      
      if (!session?.user?.walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/teams/my-teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        
        const data = await response.json();
        setTeams(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchMyTeams();
  }, [session, status]);

  const calculateTotalFunding = (projects: Team['projects']) => {
    return projects.reduce((total, project) => {
      const projectFunding = project.funding.reduce((sum, fund) => sum + fund.amount, 0);
      return total + projectFunding;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.walletAddress) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-2xl font-bold mb-4 text-gray-200">Connect Your Wallet</div>
          <p className="text-gray-700 mb-6">
            Please connect your wallet to view your admin teams.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">My Admin Teams</h1>
        <p className="text-gray-700">
          Teams where you are the administrator
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium mb-2 text-gray-200">No Admin Teams Found</h3>
            <p className="text-gray-700 mb-6">
              You don&apos;t have any teams where you are the administrator.
            </p>
            <div className="space-x-4">
              <Button asChild>
                <Link href="/teams/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/teams">
                  <Eye className="h-4 w-4 mr-2" />
                  Browse Teams
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const totalFunding = calculateTotalFunding(team.projects);
            const trustScore = team.credibility?.score || 0;
            const activeProjects = team.projects.filter(p => p.status.toLowerCase() === 'active').length;
            const completedProjects = team.projects.filter(p => p.status.toLowerCase() === 'completed').length;

            return (
              <Card key={team.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-200 mb-2">
                        {team.name}
                      </CardTitle>
                      {team.bio && (
                        <CardDescription className="text-sm text-gray-700 line-clamp-2">
                          {team.bio}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-300">
                      Admin
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-300">{team.members.length} members</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-300">{team.projects.length} projects</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-300">{Math.round(trustScore * 100)}% trust</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-300">{formatDate(team.createdAt)}</span>
                    </div>
                  </div>

                  {/* Project Status */}
                  {team.projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Project Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeProjects > 0 && (
                          <Badge className="bg-green-100 text-green-300 border-green-200">
                            {activeProjects} Active
                          </Badge>
                        )}
                        {completedProjects > 0 && (
                          <Badge className="bg-blue-100 text-blue-300 border-blue-200">
                            {completedProjects} Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Funding */}
                  {totalFunding > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Total Funding</span>
                        <span className="font-semibold text-green-700">
                          ${totalFunding.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {team.tags && team.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {team.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-700 border-gray-300">
                          {tag}
                        </Badge>
                      ))}
                      {team.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
                          +{team.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <Button size="sm" asChild className="flex-1">
                      <Link href={`/teams/${team.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Team
                      </Link>
                    </Button>
                    {team.website && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={team.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Team CTA */}
      {teams.length > 0 && (
        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/teams/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New Team
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
