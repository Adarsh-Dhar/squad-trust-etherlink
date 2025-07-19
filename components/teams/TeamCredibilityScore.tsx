"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  TrendingUp, 
  Clock, 
  Target, 
  BarChart3,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface CredibilityScore {
  id: string;
  score: number;
  lastUpdated: string;
  details?: {
    kpiScore?: {
      completionRate: number;
      timeliness: number;
      ambitionFactor: number;
      kpiAccuracy: number;
      totalScore: number;
    };
    milestoneCount?: number;
    completedCount?: number;
    kpiMilestoneCount?: number;
    lastCalculated?: string;
  };
}

interface TeamCredibilityScoreProps {
  teamId: string;
  teamName?: string;
  onRefresh?: () => Promise<void>;
}

export function TeamCredibilityScore({ teamId, teamName, onRefresh }: TeamCredibilityScoreProps) {
  const [score, setScore] = useState<CredibilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teams/${teamId}/score`);
      const data = await response.json();
      if (response.ok) {
        setScore(data);
      } else {
        setError(data.error || 'Failed to fetch score');
      }
    } catch (err) {
      setError('Failed to fetch credibility score');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/score`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setScore(data.credibilityScore);
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        setError(data.error || 'Failed to refresh score');
      }
    } catch (err) {
      setError('Failed to refresh credibility score');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, [teamId]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 0.6) return { text: "Good", color: "bg-yellow-100 text-yellow-800" };
    if (score >= 0.4) return { text: "Fair", color: "bg-orange-100 text-orange-800" };
    return { text: "Poor", color: "bg-red-100 text-red-800" };
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <Star className="w-5 h-5 text-green-600" />;
    if (score >= 0.6) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    if (score >= 0.4) return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading credibility score...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={fetchScore} size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No credibility score available</p>
            <Button onClick={handleRefresh} size="sm" className="mt-2">
              Calculate Score
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreBadge = getScoreBadge(score.score);
  const kpiScore = score.details?.kpiScore;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <CardTitle>
              {teamName ? `${teamName} Credibility Score` : 'Credibility Score'}
            </CardTitle>
          </div>
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                {getScoreIcon(score.score)}
                <span className={`text-3xl font-bold ${getScoreColor(score.score)}`}>
                  {Math.round(score.score * 100)}
                </span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <Badge className={scoreBadge.color}>
                {scoreBadge.text}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {score.details?.milestoneCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Milestones</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {score.details?.completedCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            {score.details?.kpiMilestoneCount && score.details.kpiMilestoneCount > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">KPI Milestones</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {score.details.kpiMilestoneCount} KPI-based milestones tracked
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            {kpiScore ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(kpiScore.completionRate * 100)}%
                      </span>
                    </div>
                    <Progress value={kpiScore.completionRate * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Timeliness</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(kpiScore.timeliness * 100)}%
                      </span>
                    </div>
                    <Progress value={kpiScore.timeliness * 100} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ambition Factor</span>
                      <span className="text-sm text-muted-foreground">
                        {kpiScore.ambitionFactor.toFixed(1)}x
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${Math.min(kpiScore.ambitionFactor * 33.33, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">KPI Accuracy</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(kpiScore.kpiAccuracy * 100)}%
                      </span>
                    </div>
                    <Progress value={kpiScore.kpiAccuracy * 100} className="h-2" />
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Score Calculation</div>
                  <div className="text-xs text-muted-foreground">
                    (Completion Rate × 40% + Timeliness × 20%) × Ambition Factor + KPI Accuracy × 20%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No KPI breakdown available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(score.lastUpdated).toLocaleDateString()}
                </span>
              </div>

              {score.details?.lastCalculated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Calculated</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(score.details.lastCalculated).toLocaleDateString()}
                  </span>
                </div>
              )}

              {score.details?.milestoneCount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Milestones</span>
                  <span className="text-sm text-muted-foreground">
                    {score.details.milestoneCount}
                  </span>
                </div>
              )}

              {score.details?.completedCount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed Milestones</span>
                  <span className="text-sm text-muted-foreground">
                    {score.details.completedCount}
                  </span>
                </div>
              )}

              {score.details?.kpiMilestoneCount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">KPI Milestones</span>
                  <span className="text-sm text-muted-foreground">
                    {score.details.kpiMilestoneCount}
                  </span>
                </div>
              )}

              {kpiScore && (
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">KPI Score Details</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Completion Rate:</span>
                      <span className="text-muted-foreground">
                        {Math.round(kpiScore.completionRate * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Timeliness:</span>
                      <span className="text-muted-foreground">
                        {Math.round(kpiScore.timeliness * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ambition Factor:</span>
                      <span className="text-muted-foreground">
                        {kpiScore.ambitionFactor.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>KPI Accuracy:</span>
                      <span className="text-muted-foreground">
                        {Math.round(kpiScore.kpiAccuracy * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 