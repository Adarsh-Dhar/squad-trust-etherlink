"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield, 
  Handshake,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  BarChart3,
  Award,
  Lock
} from "lucide-react";
import { VERIFICATION_TYPES } from "@/lib/credibility/kpi-scoring";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  kpi?: string;
  targetValue?: number;
  achievedValue?: number;
  kpiCategory?: string;
  difficulty?: string;
  verificationMethod?: string;
  oracleSource?: string;
  stakedAmount?: number;
  stakeCurrency?: string;
  status?: string;
  lastUpdated?: string;
  verifiers?: any[];
}

interface MilestoneCardProps {
  milestone: Milestone;
  onComplete?: (milestoneId: string, data?: any) => Promise<void>;
  onVerify?: (milestoneId: string, data: any) => Promise<void>;
  showActions?: boolean;
}

export function MilestoneCard({ milestone, onComplete, onVerify, showActions = true }: MilestoneCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState({
    verifiedValue: milestone.achievedValue || 0,
    confidence: 1.0,
    comment: "",
    verificationType: "MANUAL_VERIFICATION" as keyof typeof VERIFICATION_TYPES,
    dataSource: milestone.oracleSource || "",
  });

  const getCategoryIcon = (category?: string) => {
    const icons = {
      DEVELOPMENT: <Zap className="w-4 h-4" />,
      GROWTH: <TrendingUp className="w-4 h-4" />,
      COMMUNITY: <Users className="w-4 h-4" />,
      FUNDING: <DollarSign className="w-4 h-4" />,
      SECURITY: <Shield className="w-4 h-4" />,
      PARTNERSHIP: <Handshake className="w-4 h-4" />,
    };
    return icons[category as keyof typeof icons] || <Target className="w-4 h-4" />;
  };

  const getDifficultyColor = (difficulty?: string) => {
    const colors = {
      EASY: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HARD: "bg-orange-100 text-orange-800",
      EXPERT: "bg-red-100 text-red-800",
    };
    return colors[difficulty as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      PENDING: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      ACHIEVED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      AT_RISK: "bg-orange-100 text-orange-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status?: string) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      IN_PROGRESS: <AlertCircle className="w-4 h-4" />,
      ACHIEVED: <CheckCircle className="w-4 h-4" />,
      FAILED: <XCircle className="w-4 h-4" />,
      AT_RISK: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  const calculateProgress = () => {
    if (!milestone.targetValue || !milestone.achievedValue) return 0;
    return Math.min((milestone.achievedValue / milestone.targetValue) * 100, 100);
  };

  const isOverdue = () => {
    if (!milestone.dueDate) return false;
    return new Date() > new Date(milestone.dueDate);
  };

  const handleVerify = async () => {
    if (!onVerify) return;
    
    setIsVerifying(true);
    try {
      await onVerify(milestone.id, {
        verifierId: "current-user-id", // This should come from auth context
        ...verificationData,
      });
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    
    try {
      if (milestone.kpi) {
        await onComplete(milestone.id, {
          achievedValue: milestone.achievedValue || milestone.targetValue,
        });
      } else {
        await onComplete(milestone.id);
      }
    } catch (error) {
      console.error('Completion failed:', error);
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      milestone.completed ? 'border-green-200 bg-green-50/50' : 
      milestone.status === 'AT_RISK' ? 'border-orange-200 bg-orange-50/50' :
      milestone.status === 'FAILED' ? 'border-red-200 bg-red-50/50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center gap-2">
              {milestone.kpi ? (
                <Target className="w-5 h-5 text-blue-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <div>
                <CardTitle className="text-lg">{milestone.title}</CardTitle>
                {milestone.kpi && (
                  <p className="text-sm text-muted-foreground mt-1">
                    KPI: {milestone.kpi}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {milestone.kpiCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                {getCategoryIcon(milestone.kpiCategory)}
                {milestone.kpiCategory}
              </Badge>
            )}
            {milestone.difficulty && (
              <Badge className={getDifficultyColor(milestone.difficulty)}>
                {milestone.difficulty}
              </Badge>
            )}
            {milestone.status && (
              <Badge className={getStatusColor(milestone.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(milestone.status)}
                  {milestone.status}
                </div>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {milestone.description && (
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
        )}

        {/* KPI Progress Section */}
        {milestone.kpi && milestone.targetValue && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Progress</span>
              </div>
              <div className="text-sm">
                {milestone.achievedValue || 0} / {milestone.targetValue}
                {milestone.achievedValue && milestone.targetValue && (
                  <span className="text-muted-foreground ml-1">
                    ({Math.round((milestone.achievedValue / milestone.targetValue) * 100)}%)
                  </span>
                )}
              </div>
            </div>
            
            <Progress 
              value={calculateProgress()} 
              className="h-2"
            />
            
            {milestone.achievedValue && milestone.targetValue && (
              <div className="text-xs text-muted-foreground">
                {milestone.achievedValue >= milestone.targetValue 
                  ? "🎉 Target achieved!" 
                  : `${milestone.targetValue - milestone.achievedValue} remaining`
                }
              </div>
            )}
          </div>
        )}

        {/* Verification Info */}
        {milestone.verificationMethod && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>Verified via {milestone.verificationMethod}</span>
            {milestone.oracleSource && (
              <span>• {milestone.oracleSource}</span>
            )}
          </div>
        )}

        {/* Staking Info */}
        {milestone.stakedAmount && milestone.stakeCurrency && (
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-orange-600" />
            <span className="font-medium">Staked:</span>
            <span>{milestone.stakedAmount} {milestone.stakeCurrency}</span>
          </div>
        )}

        {/* Due Date */}
        {milestone.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
            {isOverdue() && !milestone.completed && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </div>
        )}

        {/* Last Updated */}
        {milestone.lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(milestone.lastUpdated).toLocaleDateString()}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2">
            {!milestone.completed ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleComplete}
                  className="flex-1"
                >
                  {milestone.kpi ? "Mark Complete" : "Complete"}
                </Button>
                
                {milestone.kpi && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Verify KPI Milestone</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="verifiedValue">Verified Value</Label>
                          <Input
                            id="verifiedValue"
                            type="number"
                            step="any"
                            value={verificationData.verifiedValue}
                            onChange={(e) => setVerificationData(prev => ({
                              ...prev,
                              verifiedValue: parseFloat(e.target.value) || 0
                            }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confidence">Confidence (0-1)</Label>
                          <Input
                            id="confidence"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={verificationData.confidence}
                            onChange={(e) => setVerificationData(prev => ({
                              ...prev,
                              confidence: parseFloat(e.target.value) || 0
                            }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="verificationType">Verification Type</Label>
                          <Select 
                            value={verificationData.verificationType}
                            onValueChange={(value) => setVerificationData(prev => ({
                              ...prev,
                              verificationType: value as keyof typeof VERIFICATION_TYPES
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(VERIFICATION_TYPES).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="dataSource">Data Source</Label>
                          <Input
                            id="dataSource"
                            value={verificationData.dataSource}
                            onChange={(e) => setVerificationData(prev => ({
                              ...prev,
                              dataSource: e.target.value
                            }))}
                            placeholder="e.g., Google Analytics, DefiLlama"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="comment">Comment</Label>
                          <Textarea
                            id="comment"
                            value={verificationData.comment}
                            onChange={(e) => setVerificationData(prev => ({
                              ...prev,
                              comment: e.target.value
                            }))}
                            placeholder="Additional verification notes..."
                          />
                        </div>
                        
                        <Button 
                          onClick={handleVerify}
                          disabled={isVerifying}
                          className="w-full"
                        >
                          {isVerifying ? "Verifying..." : "Submit Verification"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Completed</span>
                {milestone.kpi && milestone.achievedValue && milestone.targetValue && (
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((milestone.achievedValue / milestone.targetValue) * 100)}% accuracy)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 