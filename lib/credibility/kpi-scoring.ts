// KPI-based credibility scoring logic
export interface KPIScore {
  completionRate: number;
  timeliness: number;
  ambitionFactor: number;
  kpiAccuracy: number;
  totalScore: number;
}

export interface MilestoneData {
  id: string;
  kpi?: string;
  targetValue?: number;
  achievedValue?: number;
  difficulty?: string;
  status?: string;
  dueDate?: Date;
  completed: boolean;
}

export function calculateKPIScore(milestones: MilestoneData[]): KPIScore {
  if (milestones.length === 0) {
    return {
      completionRate: 0,
      timeliness: 0,
      ambitionFactor: 0,
      kpiAccuracy: 0,
      totalScore: 0,
    };
  }

  // Calculate completion rate (60% weight)
  const completedMilestones = milestones.filter(m => m.completed);
  const completionRate = completedMilestones.length / milestones.length;

  // Calculate timeliness (20% weight)
  const onTimeMilestones = completedMilestones.filter(m => {
    if (!m.dueDate) return true;
    // Consider on-time if completed before or on due date
    return new Date(m.dueDate) >= new Date();
  });
  const timeliness = onTimeMilestones.length / completedMilestones.length || 0;

  // Calculate ambition factor based on difficulty (20% weight)
  const difficultyScores = {
    'EASY': 1.0,
    'MEDIUM': 1.5,
    'HARD': 2.0,
    'EXPERT': 3.0,
  };
  
  const kpiMilestones = milestones.filter(m => m.kpi);
  const ambitionFactor = kpiMilestones.length > 0 
    ? kpiMilestones.reduce((sum, m) => {
        const difficulty = m.difficulty || 'MEDIUM';
        return sum + (difficultyScores[difficulty as keyof typeof difficultyScores] || 1.5);
      }, 0) / kpiMilestones.length
    : 1.0;

  // Calculate KPI accuracy bonus (20% bonus potential)
  const kpiAccuracy = kpiMilestones.length > 0 
    ? kpiMilestones.reduce((sum, m) => {
        if (!m.targetValue || !m.achievedValue) return sum;
        const deviation = Math.abs(m.targetValue - m.achievedValue) / m.targetValue;
        return sum + (1 - deviation);
      }, 0) / kpiMilestones.length
    : 0;

  // Calculate total score
  const totalScore = (completionRate * 0.4 + timeliness * 0.2) * ambitionFactor + kpiAccuracy * 0.2;

  return {
    completionRate,
    timeliness,
    ambitionFactor,
    kpiAccuracy,
    totalScore: Math.min(totalScore, 1.0), // Cap at 1.0
  };
}

export function getDifficultyTier(kpi: string, targetValue: number): string {
  // Simple heuristic based on KPI type and target value
  const kpiLower = kpi.toLowerCase();
  
  if (kpiLower.includes('test') || kpiLower.includes('deploy') || kpiLower.includes('setup')) {
    return 'EASY';
  }
  
  if (kpiLower.includes('user') || kpiLower.includes('member')) {
    if (targetValue <= 100) return 'EASY';
    if (targetValue <= 1000) return 'MEDIUM';
    if (targetValue <= 10000) return 'HARD';
    return 'EXPERT';
  }
  
  if (kpiLower.includes('revenue') || kpiLower.includes('funding')) {
    if (targetValue <= 1000) return 'EASY';
    if (targetValue <= 10000) return 'MEDIUM';
    if (targetValue <= 100000) return 'HARD';
    return 'EXPERT';
  }
  
  if (kpiLower.includes('audit') || kpiLower.includes('security')) {
    return 'HARD';
  }
  
  return 'MEDIUM';
}

export const KPI_CATEGORIES = {
  DEVELOPMENT: 'Development',
  GROWTH: 'Growth', 
  COMMUNITY: 'Community',
  FUNDING: 'Funding',
  SECURITY: 'Security',
  PARTNERSHIP: 'Partnership',
} as const;

export const DIFFICULTY_TIERS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert',
} as const;

export const VERIFICATION_TYPES = {
  AUTOMATED_ORACLE: 'Automated Oracle',
  MANUAL_VERIFICATION: 'Manual Verification',
  COMMUNITY_VOTE: 'Community Vote',
  AUDIT_REPORT: 'Audit Report',
} as const; 