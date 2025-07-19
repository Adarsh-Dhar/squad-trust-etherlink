interface CredibilityMetrics {
  completionRate: number; // 0-1: shipped deliverables / planned deliverables
  timelineAccuracy: number; // 0-1: estimated time / actual time taken
  budgetEfficiency: number; // 0-1: estimated budget / actual spend
  memberRetentionRate: number; // 0-1: retained members / total members
  funderRating: number; // 0-1: average funder rating
  hasAbandoned: boolean; // true if project was abandoned
}

/**
 * Calculates a credibility score based on project metrics
 * @param metrics Object containing credibility metrics
 * @returns Credibility score between 0-1
 */
export function calculateCredibilityScore(metrics: CredibilityMetrics): number {
  // Base score calculation
  const projectCompletion = metrics.completionRate * 0.4;
  const timelineScore = metrics.timelineAccuracy * 0.2;
  const budgetScore = metrics.budgetEfficiency * 0.2;
  
  // Peer consensus combines member retention and funder satisfaction
  const peerConsensus = (
    (metrics.memberRetentionRate * 0.5) + 
    (metrics.funderRating * 0.5)
  ) * 0.2;

  // Calculate total score
  let totalScore = projectCompletion + timelineScore + budgetScore + peerConsensus;

  // Apply abandonment penalty if applicable
  if (metrics.hasAbandoned) {
    totalScore *= 0.5; // 50% penalty for abandonment
  }

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, totalScore));
}
