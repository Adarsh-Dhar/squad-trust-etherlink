// SquadTrust Scoring System Implementation
// Multi-dimensional reputation algorithm with time decay, milestone weighting, and anti-gaming mechanisms

import { calculateKPIScore, MilestoneData as KPIMilestoneData, KPIScore } from '../credibility/kpi-scoring';

export interface ScoreData {
  projectsShipped: number;
  onTimeRate: number; // Percentage (0-100)
  budgetAccuracy: number; // Percentage (0-100)
  abandonedProjects: number;
  lastActivity: number; // Unix timestamp
  credibilityScore: number;
  totalScore: number;
}

export interface MilestoneData {
  description: string;
  dueDate: number; // Unix timestamp
  confirmations: number;
  hasConfirmed: Record<string, boolean>;
}

export interface ProjectData {
  id: string;
  creator: string;
  memberList: string[];
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  estimatedDuration: number; // in seconds
  estimatedCost: number;
  actualCost?: number;
  projectType: ProjectType;
  teamId: string; // Added for team scoring
}

export enum ProjectType {
  HACKATHON = 'HACKATHON',
  STARTUP = 'STARTUP',
  ENTERPRISE = 'ENTERPRISE'
}

export interface OracleVerification {
  requestId: string;
  projectId: string;
  repoUrl: string;
  isValid: boolean;
  commitCount: number;
}

// Constants
export const TIME_DECAY_FACTOR = 2; // Recent work = 2x impact
export const SECONDS_PER_YEAR = 31536000;
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_MONTH = 2592000;
export const ABANDONED_PROJECT_PENALTY = 2000;
export const MINIMUM_ACTIVITY_THRESHOLD = 180 * SECONDS_PER_DAY; // 180 days
export const INACTIVE_MONTHS_THRESHOLD = 6;
export const DECAY_FACTOR_PER_MONTH = 1; // 1% decay per month after 6 months

// Global state (in production, this would be stored in a database)
const scoreRegistry: Record<string, ScoreData> = {
  // Sample data for testing
  "0x1234567890123456789012345678901234567890": {
    projectsShipped: 5,
    onTimeRate: 85,
    budgetAccuracy: 90,
    abandonedProjects: 0,
    lastActivity: Math.floor(Date.now() / 1000),
    credibilityScore: 250,
    totalScore: 0
  },
  "0x2345678901234567890123456789012345678901": {
    projectsShipped: 3,
    onTimeRate: 75,
    budgetAccuracy: 80,
    abandonedProjects: 1,
    lastActivity: Math.floor(Date.now() / 1000),
    credibilityScore: 150,
    totalScore: 0
  },
  "0x3456789012345678901234567890123456789012": {
    projectsShipped: 8,
    onTimeRate: 95,
    budgetAccuracy: 95,
    abandonedProjects: 0,
    lastActivity: Math.floor(Date.now() / 1000),
    credibilityScore: 400,
    totalScore: 0
  },
  // Actual wallet address from the database
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": {
    projectsShipped: 7,
    onTimeRate: 88,
    budgetAccuracy: 92,
    abandonedProjects: 0,
    lastActivity: Math.floor(Date.now() / 1000),
    credibilityScore: 320,
    totalScore: 0
  },
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": {
    projectsShipped: 4,
    onTimeRate: 92,
    budgetAccuracy: 87,
    abandonedProjects: 0,
    lastActivity: Math.floor(Date.now() / 1000),
    credibilityScore: 280,
    totalScore: 0
  }
};
const milestoneRegistry: Record<string, Record<number, MilestoneData>> = {};
const projectRegistry: Record<string, ProjectData> = {};
const abandonedVotes: Record<string, number> = {};
const oracleVerifications: Record<string, OracleVerification> = {};

/**
 * Calculate comprehensive score for a member
 * @param memberAddress - The member's address
 * @returns The calculated score
 */
export function calculateScore(memberAddress: string): number {
  const memberData = scoreRegistry[memberAddress];
  if (!memberData) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  
  // Apply time decay multiplier
  const timeSinceLastActivity = currentTime - memberData.lastActivity;
  const timeFactor = timeSinceLastActivity < MINIMUM_ACTIVITY_THRESHOLD ? TIME_DECAY_FACTOR : 1;

  // Core scoring algorithm
  const score = 
    (memberData.projectsShipped * 40 * timeFactor) +
    (memberData.onTimeRate * 30) +
    (memberData.budgetAccuracy * 30) -
    (memberData.abandonedProjects * ABANDONED_PROJECT_PENALTY);

  return Math.max(score, 0);
}

/**
 * Apply time decay to member's credibility score
 * @param memberAddress - The member's address
 */
export function applyTimeDecay(memberAddress: string): void {
  const memberData = scoreRegistry[memberAddress];
  if (!memberData) return;

  const currentTime = Math.floor(Date.now() / 1000);
  const inactiveMonths = Math.floor((currentTime - memberData.lastActivity) / SECONDS_PER_MONTH);
  
  if (inactiveMonths > INACTIVE_MONTHS_THRESHOLD) {
    const decayFactor = inactiveMonths - INACTIVE_MONTHS_THRESHOLD;
    const decayPercentage = Math.min(decayFactor * DECAY_FACTOR_PER_MONTH, 50); // Max 50% decay
    memberData.credibilityScore = Math.floor(memberData.credibilityScore * (100 - decayPercentage) / 100);
    memberData.lastActivity = currentTime;
  }
}

/**
 * Get credibility score with time decay applied
 * @param memberAddress - The member's address
 * @returns The credibility score
 */
export function getCredibilityScore(memberAddress: string): number {
  applyTimeDecay(memberAddress);
  const memberData = scoreRegistry[memberAddress];
  return memberData ? memberData.credibilityScore : 0;
}

/**
 * Update scoring system when a milestone is confirmed on blockchain
 * This function should be called after the blockchain confirmMilestone transaction
 * @param projectId - The project ID
 * @param milestoneId - The milestone ID
 * @param description - Milestone description
 * @param dueDate - Due date in Unix timestamp
 * @param memberAddress - The member who confirmed the milestone
 */
export function updateScoreAfterMilestoneConfirmation(
  projectId: string,
  milestoneId: number,
  description: string,
  dueDate: number,
  memberAddress: string
): void {
  const project = projectRegistry[projectId];
  if (!project || project.completed) {
    throw new Error("Project not found or already completed");
  }

  // Initialize milestone if it doesn't exist
  if (!milestoneRegistry[projectId]) {
    milestoneRegistry[projectId] = {};
  }
  
  if (!milestoneRegistry[projectId][milestoneId]) {
    milestoneRegistry[projectId][milestoneId] = {
      description,
      dueDate,
      confirmations: 0,
      hasConfirmed: {}
    };
  }

  const milestone = milestoneRegistry[projectId][milestoneId];
  
  if (milestone.hasConfirmed[memberAddress]) {
    throw new Error("Already confirmed");
  }

  milestone.hasConfirmed[memberAddress] = true;
  milestone.confirmations++;

  // Initialize member data if not exists
  if (!scoreRegistry[memberAddress]) {
    scoreRegistry[memberAddress] = {
      projectsShipped: 0,
      onTimeRate: 0,
      budgetAccuracy: 0,
      abandonedProjects: 0,
      lastActivity: Math.floor(Date.now() / 1000),
      credibilityScore: 0,
      totalScore: 0
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const memberData = scoreRegistry[memberAddress];

  // Track timeliness
  let timelinessScore: number;
  if (currentTime <= dueDate) {
    timelinessScore = 100;
  } else {
    const delayDays = Math.floor((currentTime - dueDate) / SECONDS_PER_DAY);
    timelinessScore = Math.max(100 - delayDays * 10, 0); // 10% penalty per day
  }

  // Update on-time rate (weighted average)
  memberData.onTimeRate = Math.floor(
    ((memberData.onTimeRate * memberData.projectsShipped) + timelinessScore) / 
    (memberData.projectsShipped + 1)
  );

  // Update last activity
  memberData.lastActivity = currentTime;
  
  // Recalculate total score
  memberData.totalScore = calculateScore(memberAddress);
}

/**
 * Log budget performance and update accuracy scores
 * @param projectId - The project ID
 * @param estimatedCost - Estimated project cost
 * @param actualCost - Actual project cost
 */
export function logBudgetPerformance(
  projectId: string,
  estimatedCost: number,
  actualCost: number
): void {
  const project = projectRegistry[projectId];
  if (!project || project.completed) {
    throw new Error("Project not found or already completed");
  }

  let accuracy: number;
  if (actualCost <= estimatedCost) {
    accuracy = 100;
  } else {
    accuracy = Math.max(100 - ((actualCost - estimatedCost) * 100) / estimatedCost, 0);
  }

  // Update budget accuracy for all project members
  for (const member of project.memberList) {
    if (!scoreRegistry[member]) {
      scoreRegistry[member] = {
        projectsShipped: 0,
        onTimeRate: 0,
        budgetAccuracy: 0,
        abandonedProjects: 0,
        lastActivity: Math.floor(Date.now() / 1000),
        credibilityScore: 0,
        totalScore: 0
      };
    }

    const memberData = scoreRegistry[member];
    memberData.budgetAccuracy = Math.floor(
      ((memberData.budgetAccuracy * memberData.projectsShipped) + accuracy) / 
      (memberData.projectsShipped + 1)
    );
    
    memberData.totalScore = calculateScore(member);
  }
}

/**
 * Update scoring system when a project is completed on blockchain
 * This function should be called after the blockchain completeProject transaction
 * @param projectId - The project ID
 * @param creatorAddress - The project creator's address
 * @param projectType - The type of project for weighting
 */
export function updateScoreAfterProjectCompletion(
  projectId: string,
  creatorAddress: string,
  projectType: ProjectType = ProjectType.STARTUP
): void {
  const project = projectRegistry[projectId];
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.creator !== creatorAddress) {
    throw new Error("Only creator can complete project");
  }
  
  if (project.completed) {
    throw new Error("Project already completed");
  }

  project.completed = true;
  project.completedAt = Math.floor(Date.now() / 1000);
  project.projectType = projectType;

  // Calculate project type weight
  let typeWeight: number;
  switch (projectType) {
    case ProjectType.HACKATHON:
      typeWeight = 10;
      break;
    case ProjectType.STARTUP:
      typeWeight = 30;
      break;
    case ProjectType.ENTERPRISE:
      typeWeight = 60;
      break;
    default:
      typeWeight = 30;
  }

  // Update member stats
  for (const member of project.memberList) {
    if (!scoreRegistry[member]) {
      scoreRegistry[member] = {
        projectsShipped: 0,
        onTimeRate: 0,
        budgetAccuracy: 0,
        abandonedProjects: 0,
        lastActivity: Math.floor(Date.now() / 1000),
        credibilityScore: 0,
        totalScore: 0
      };
    }

    const memberData = scoreRegistry[member];
    memberData.projectsShipped++;
    memberData.lastActivity = Math.floor(Date.now() / 1000);
    memberData.credibilityScore += typeWeight;
    memberData.totalScore = calculateScore(member);
  }
}

/**
 * Mark a project as abandoned and apply penalties
 * @param projectId - The project ID
 * @param votes - Number of votes for abandonment
 */
export function markProjectAbandoned(projectId: string, votes: number): void {
  const project = projectRegistry[projectId];
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.completed) {
    throw new Error("Project already completed");
  }

  // Check if enough time has passed (2x estimated duration)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceCreation = currentTime - project.createdAt;
  const requiredTime = project.estimatedDuration * 2;
  
  if (timeSinceCreation <= requiredTime) {
    throw new Error("Too early to abandon project");
  }

  // Verify through DAO vote (simplified)
  const requiredVotes = Math.floor(project.memberList.length / 2) + 1;
  if (votes < requiredVotes) {
    throw new Error("Insufficient votes for abandonment");
  }

  // Apply penalties to all members
  for (const member of project.memberList) {
    if (scoreRegistry[member]) {
      const memberData = scoreRegistry[member];
      memberData.abandonedProjects++;
      
      // Apply penalty to credibility
      memberData.credibilityScore = Math.max(memberData.credibilityScore - ABANDONED_PROJECT_PENALTY, 0);
      memberData.totalScore = calculateScore(member);
    }
  }

  project.completed = true; // Mark as abandoned
}

/**
 * Request GitHub verification for a project
 * @param projectId - The project ID
 * @param repoUrl - GitHub repository URL
 * @param memberAddress - The member requesting verification
 */
export function requestGitHubVerification(
  projectId: string,
  repoUrl: string,
  memberAddress: string
): string {
  const project = projectRegistry[projectId];
  if (!project) {
    throw new Error("Project not found");
  }

  const requestId = generateRequestId(projectId, repoUrl);
  
  oracleVerifications[requestId] = {
    requestId,
    projectId,
    repoUrl,
    isValid: false,
    commitCount: 0
  };

  // In production, this would trigger a Chainlink oracle call
  // For now, we'll simulate the verification process
  setTimeout(() => {
    simulateOracleVerification(requestId, repoUrl);
  }, 1000);

  return requestId;
}

/**
 * Fulfill oracle verification (simulated)
 * @param requestId - The verification request ID
 * @param isValid - Whether the verification is valid
 * @param commitCount - Number of commits found
 */
export function fulfillVerification(
  requestId: string,
  isValid: boolean,
  commitCount: number
): void {
  const verification = oracleVerifications[requestId];
  if (!verification) {
    throw new Error("Verification request not found");
  }

  verification.isValid = isValid;
  verification.commitCount = commitCount;

  const project = projectRegistry[verification.projectId];
  if (!project) return;

  if (isValid) {
    // Reward the project creator
    if (scoreRegistry[project.creator]) {
      scoreRegistry[project.creator].credibilityScore += commitCount * 10;
      scoreRegistry[project.creator].totalScore = calculateScore(project.creator);
    }
  } else {
    // Penalize all project members
    for (const member of project.memberList) {
      if (scoreRegistry[member]) {
        scoreRegistry[member].credibilityScore = Math.max(scoreRegistry[member].credibilityScore - 500, 0);
        scoreRegistry[member].totalScore = calculateScore(member);
      }
    }
  }
}

/**
 * Get comprehensive score data for a member
 * @param memberAddress - The member's address
 * @returns Complete score data
 */
export function getMemberScoreData(memberAddress: string): ScoreData | null {
  applyTimeDecay(memberAddress);
  return scoreRegistry[memberAddress] || null;
}

/**
 * Get all members with their scores (for leaderboards)
 * @returns Array of member addresses with their scores
 */
export function getAllMemberScores(): Array<{ address: string; score: number; data: ScoreData }> {
  const members = Object.keys(scoreRegistry);
  return members.map(address => ({
    address,
    score: calculateScore(address),
    data: scoreRegistry[address]
  })).sort((a, b) => b.score - a.score);
}

/**
 * Get project statistics
 * @param projectId - The project ID
 * @returns Project statistics
 */
export function getProjectStats(projectId: string): {
  memberScores: Array<{ address: string; score: number }>;
  milestones: Record<number, MilestoneData>;
  project: ProjectData;
} | null {
  const project = projectRegistry[projectId];
  if (!project) return null;

  const memberScores = project.memberList.map(address => ({
    address,
    score: calculateScore(address)
  }));

  return {
    memberScores,
    milestones: milestoneRegistry[projectId] || {},
    project
  };
}

/**
 * Add a member to a project
 * @param projectId - The project ID
 * @param memberAddress - The member's address
 */
export function addProjectMember(projectId: string, memberAddress: string): void {
  const project = projectRegistry[projectId];
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.completed) {
    throw new Error("Cannot add member to completed project");
  }

  if (!project.memberList.includes(memberAddress)) {
    project.memberList.push(memberAddress);
  }
}

/**
 * Vote to abandon a project
 * @param projectId - The project ID
 * @param voterAddress - The voter's address
 */
export function voteToAbandon(projectId: string, voterAddress: string): void {
  const project = projectRegistry[projectId];
  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.memberList.includes(voterAddress)) {
    throw new Error("Only project members can vote");
  }

  abandonedVotes[projectId] = (abandonedVotes[projectId] || 0) + 1;
}

/**
 * Calculate the KPI-based team score for a given team
 * @param teamId - The team ID
 * @returns KPIScore object (completionRate, timeliness, ambitionFactor, kpiAccuracy, totalScore)
 */
export function calculateTeamScore(teamId: string): KPIScore {
  // Gather all projects for the team
  const projects = Object.values(projectRegistry).filter(p => (p as any).teamId === teamId);
  if (projects.length === 0) {
    return {
      completionRate: 0,
      timeliness: 0,
      ambitionFactor: 0,
      kpiAccuracy: 0,
      totalScore: 0,
    };
  }

  // Gather all milestones for all projects
  const allMilestones: KPIMilestoneData[] = [];
  for (const project of projects) {
    const milestones = milestoneRegistry[project.id];
    if (milestones) {
      for (const [milestoneId, milestone] of Object.entries(milestones)) {
        // Convert to KPI MilestoneData format
        allMilestones.push({
          id: milestoneId,
          kpi: undefined, // If you have a KPI field, map it here
          targetValue: undefined, // If you have target/achieved values, map here
          achievedValue: undefined,
          difficulty: undefined,
          status: undefined,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate * 1000) : undefined,
          completed: true, // You may want to infer this from confirmations or other logic
        });
      }
    }
  }

  return calculateKPIScore(allMilestones);
}

// Utility functions
function generateRequestId(projectId: string, repoUrl: string): string {
  return `${projectId}-${repoUrl}-${Date.now()}`;
}

function simulateOracleVerification(requestId: string, repoUrl: string): void {
  // Simulate oracle verification with random results
  const isValid = Math.random() > 0.3; // 70% success rate
  const commitCount = Math.floor(Math.random() * 100) + 1;
  
  fulfillVerification(requestId, isValid, commitCount);
}

/**
 * Get reputation components breakdown for a member
 * @param memberAddress - The member's address
 * @returns Detailed reputation breakdown
 */
export function getReputationBreakdown(memberAddress: string): {
  projectsShipped: number;
  onTimeRate: number;
  budgetAccuracy: number;
  abandonedProjects: number;
  timeFactor: number;
  credibilityScore: number;
  totalScore: number;
  lastActivity: string;
} | null {
  const memberData = scoreRegistry[memberAddress];
  if (!memberData) return null;

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceLastActivity = currentTime - memberData.lastActivity;
  const timeFactor = timeSinceLastActivity < MINIMUM_ACTIVITY_THRESHOLD ? TIME_DECAY_FACTOR : 1;

  return {
    projectsShipped: memberData.projectsShipped,
    onTimeRate: memberData.onTimeRate,
    budgetAccuracy: memberData.budgetAccuracy,
    abandonedProjects: memberData.abandonedProjects,
    timeFactor,
    credibilityScore: memberData.credibilityScore,
    totalScore: calculateScore(memberAddress),
    lastActivity: new Date(memberData.lastActivity * 1000).toISOString()
  };
}

/**
 * Reset all data (for testing purposes)
 */
export function resetAllData(): void {
  Object.keys(scoreRegistry).forEach(key => delete scoreRegistry[key]);
  Object.keys(milestoneRegistry).forEach(key => delete milestoneRegistry[key]);
  Object.keys(projectRegistry).forEach(key => delete projectRegistry[key]);
  Object.keys(abandonedVotes).forEach(key => delete abandonedVotes[key]);
  Object.keys(oracleVerifications).forEach(key => delete oracleVerifications[key]);
}
