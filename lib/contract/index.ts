import { ethers, parseEther, formatEther, isAddress, BrowserProvider, getBytes } from 'ethers';
import { abi } from './abi';
import { address as contractAddress } from './address';

// Contract ABI - you'll need to compile the contract and import the ABI
// For now, I'll define the essential types and interfaces

export interface Project {
  name: string;
  creator: string;
  completed: boolean;
  abandoned: boolean;
  createdAt: number;
  completedAt: number;
  abandonedAt: number;
  memberCount: number;
  budget: string;
  actualCost: string;
  deadline: number;
}

export interface MemberRole {
  role: string;
  verified: boolean;
  stakeAmount: string;
  lastActivity: number;
  isDisputed: boolean;
}

export interface Milestone {
  description: string;
  confirmed: boolean;
  confirmations: number;
  deadline: number;
}

export interface ProjectRole {
  member: string;
  role: string;
}

export interface Dispute {
  disputer: string;
  target: string;
  reason: string;
  createdAt: number;
  resolved: boolean;
  inFavorOfDisputer: boolean;
  votesForDisputer: number;
  votesForTarget: number;
  voters: string[];
}

export interface MemberStats {
  projectsShipped: number;
  onTimeRateScore: number;
  budgetAccuracyScore: number;
  abandoned: number;
  lastProject: number;
}

export interface PortableReputation {
  score: number;
  lastUpdated: number;
  projectsShipped: number;
  onTimeRate: number;
  budgetAccuracy: number;
  projectsAbandoned: number;
  projectProofs: string[];
}

export interface SquadTrustContract {
  // Core Functions
  createProject(name: string, requiredConfirmations: number, budget: string, deadline: number): Promise<string>;
  claimRole(projectId: string, role: string): Promise<void>;
  verifyRole(projectId: string, member: string): Promise<void>;
  verifyRoleBySig(member: string, projectId: string, role: string, v: number, r: string, s: string): Promise<void>;
  confirmMilestone(projectId: string, milestoneId: number, description: string): Promise<void>;
  completeProject(projectId: string, actualCost: string): Promise<void>;
  abandonProject(projectId: string): Promise<void>;
  withdrawStake(projectId: string): Promise<void>;
  
  // Dispute Resolution
  createDispute(projectId: string, target: string, reason: string): Promise<void>;
  voteOnDispute(disputeId: string, voteForDisputer: boolean): Promise<void>;
  slashStake(projectId: string, member: string): Promise<void>;
  
  // View Functions
  getProject(projectId: string): Promise<Project>;
  getMemberRole(projectId: string, member: string): Promise<MemberRole>;
  getMemberProjects(member: string): Promise<string[]>;
  getProjectMembers(projectId: string): Promise<string[]>;
  getCredibilityScore(member: string): Promise<number>;
  getMilestone(projectId: string, milestoneId: number): Promise<Milestone>;
  getAllProjects(): Promise<string[]>;
  getProjectRoles(projectId: string): Promise<ProjectRole[]>;
  getDispute(disputeId: string): Promise<Dispute>;
  getMemberStats(member: string): Promise<MemberStats>;
  getPortableReputation(member: string): Promise<PortableReputation>;
  
  // Constants
  MIN_STAKE(): Promise<string>;
  REPUTATION_THRESHOLD(): Promise<number>;
  DISPUTER_REWARD_PERCENTAGE(): Promise<number>;
  SLASH_PERCENTAGE(): Promise<number>;
  TIME_DECAY_PERIOD(): Promise<number>;
  projectCount(): Promise<number>;
  disputeCount(): Promise<number>;
}

export class SquadTrustService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddressParam: string = contractAddress, signer: ethers.Signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddressParam, abi, signer);
  }

  // ============ CORE FUNCTIONS ============

  /**
   * Create a new project
   * @param name Project name
   * @param requiredConfirmations Number of confirmations needed for milestones
   * @param budget Project budget in ETH (e.g., "1000")
   * @param deadline Project deadline as Unix timestamp
   * @returns Project ID
   */
  async createProject(name: string, requiredConfirmations: number, budget: string, deadline: number): Promise<string> {
    try {
      console.log("Creating project:", name, requiredConfirmations, budget, deadline);
      
      // First, verify the contract is deployed
      try {
        const code = await this.contract.runner?.provider?.getCode(this.contract.target);
        if (!code || code === "0x") {
          throw new Error("Contract is not deployed at the specified address");
        }
        console.log("Contract is deployed at:", this.contract.target);
      } catch (e) {
        console.error("Error checking contract deployment:", e);
      }
      
      const budgetWei = parseEther(budget);
      
      // Create project on blockchain - the function returns the projectId directly
      const tx = await this.contract.createProject(name, requiredConfirmations, budgetWei, deadline);
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // Try to get the projectId from the transaction receipt
      if (receipt.logs && receipt.logs.length > 0) {
        console.log("Processing", receipt.logs.length, "logs");
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          console.log(`Log ${i}:`, log);
          try {
            // Try to parse the log using the contract interface
            const parsedLog = this.contract.interface.parseLog(log);
            console.log(`Parsed log ${i}:`, parsedLog);
            if (parsedLog?.name === 'ProjectCreated') {
              const projectId = parsedLog.args.projectId.toString();
              console.log("Found ProjectCreated event with projectId:", projectId);
              return projectId;
            }
          } catch (e) {
            console.log(`Failed to parse log ${i}:`, e);
            // Skip logs that can't be parsed by our contract interface
            continue;
          }
        }
      }
      
      // If we can't get the projectId from logs, throw an error
      throw new Error("Could not determine project ID from transaction. Project creation failed.");
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Claim a role in a project with stake
   * @param projectId The project identifier
   * @param role Role description
   */
  async claimRole(projectId: string, role: string): Promise<void> {
    try {
      // Get minimum stake amount
      const minStake = await this.contract.MIN_STAKE();
      const tx = await this.contract.claimRole(projectId, role, { value: minStake });
      await tx.wait();
    } catch (error) {
      console.error('Error claiming role:', error);
      throw error;
    }
  }

  /**
   * Verify a member's role (only by project creator)
   * @param projectId The project identifier
   * @param member Address of the member to verify
   */
  async verifyRole(projectId: string, member: string): Promise<void> {
    try {
      // Check if the member has claimed a role before verifying
      const memberRole = await this.getMemberRole(projectId, member);
      console.log('verifyRole: memberRole for', member, 'in project', projectId, '=', memberRole);
      if (!memberRole || !memberRole.role || memberRole.role === "") {
        throw new SquadTrustError('This member has not claimed a role and cannot be verified.');
      }
      const tx = await this.contract.verifyRole(projectId, member);
      await tx.wait();
    } catch (error) {
      console.error('Error verifying role:', error);
      throw error;
    }
  }

  /**
   * Verify role using signature
   * @param member Member address
   * @param projectId The project identifier
   * @param role Role description
   * @param v Signature v component
   * @param r Signature r component
   * @param s Signature s component
   */
  async verifyRoleBySig(member: string, projectId: string, role: string, v: number, r: string, s: string): Promise<void> {
    try {
      const tx = await this.contract.verifyRoleBySig(member, projectId, role, v, r, s);
      await tx.wait();
    } catch (error) {
      console.error('Error verifying role by signature:', error);
      throw error;
    }
  }

  /**
   * Confirm project milestone completion
   * @param projectId The project identifier
   * @param milestoneId Milestone identifier
   * @param description Milestone description
   */
  async confirmMilestone(projectId: string, milestoneId: number, description: string): Promise<void> {
    try {
      const tx = await this.contract.confirmMilestone(projectId, milestoneId, description);
      await tx.wait();
    } catch (error) {
      console.error('Error confirming milestone:', error);
      throw error;
    }
  }

  /**
   * Complete project and update credibility scores
   * @param projectId The project identifier
   * @param actualCost Actual cost of the project in ETH (e.g., "950")
   */
  async completeProject(projectId: string, actualCost: string): Promise<void> {
    try {
      const actualCostWei = parseEther(actualCost);
      const tx = await this.contract.completeProject(projectId, actualCostWei);
      await tx.wait();
    } catch (error) {
      console.error('Error completing project:', error);
      throw error;
    }
  }

  /**
   * Abandon project
   * @param projectId The project identifier
   */
  async abandonProject(projectId: string): Promise<void> {
    try {
      const tx = await this.contract.abandonProject(projectId);
      await tx.wait();
    } catch (error) {
      console.error('Error abandoning project:', error);
      throw error;
    }
  }

  /**
   * Withdraw stake after role verification
   * @param projectId The project identifier
   */
  async withdrawStake(projectId: string): Promise<void> {
    try {
      const tx = await this.contract.withdrawStake(projectId);
      await tx.wait();
    } catch (error) {
      console.error('Error withdrawing stake:', error);
      throw error;
    }
  }

  // ============ DISPUTE RESOLUTION ============

  /**
   * Create a dispute against a member
   * @param projectId The project identifier
   * @param target Target member address
   * @param reason Dispute reason
   */
  async createDispute(projectId: string, target: string, reason: string): Promise<void> {
    try {
      const tx = await this.contract.createDispute(projectId, target, reason);
      await tx.wait();
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw error;
    }
  }

  /**
   * Vote on a dispute
   * @param disputeId Dispute identifier
   * @param voteForDisputer Whether to vote for the disputer
   */
  async voteOnDispute(disputeId: string, voteForDisputer: boolean): Promise<void> {
    try {
      const tx = await this.contract.voteOnDispute(disputeId, voteForDisputer);
      await tx.wait();
    } catch (error) {
      console.error('Error voting on dispute:', error);
      throw error;
    }
  }

  /**
   * Slash stake of a member
   * @param projectId The project identifier
   * @param member Member address
   */
  async slashStake(projectId: string, member: string): Promise<void> {
    try {
      const tx = await this.contract.slashStake(projectId, member);
      await tx.wait();
    } catch (error) {
      console.error('Error slashing stake:', error);
      throw error;
    }
  }

  // ============ VIEW FUNCTIONS ============

  /**
   * Get project details
   * @param projectId The project identifier
   * @returns Project details
   */
  async getProject(projectId: string): Promise<Project> {
    try {
      const result = await this.contract.getProject(projectId);
      return {
        name: result[0],
        creator: result[1],
        completed: result[2],
        abandoned: result[3],
        createdAt: Number(result[4]),
        completedAt: Number(result[5]),
        abandonedAt: Number(result[6]),
        memberCount: Number(result[7]),
        budget: formatEther(result[8]),
        actualCost: formatEther(result[9]),
        deadline: Number(result[10])
      };
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  /**
   * Get member's role in project
   * @param projectId The project identifier
   * @param member Member address
   * @returns Member role details
   */
  async getMemberRole(projectId: string, member: string): Promise<MemberRole | null> {
    try {
      const result = await this.contract.getMemberRole(projectId, member);
      return {
        role: result[0],
        verified: result[1],
        stakeAmount: formatEther(result[2]),
        lastActivity: Number(result[3]),
        isDisputed: result[4]
      };
    } catch (error: any) {
      if (
        error?.code === 'BAD_DATA' &&
        error?.message?.includes('could not decode result data')
      ) {
        // Suppress expected error: user has no on-chain role
        return null;
      }
      console.error('Error getting member role:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a member
   * @param member Member address
   * @returns Array of project IDs
   */
  async getMemberProjects(member: string): Promise<string[]> {
    try {
      return await this.contract.getMemberProjects(member);
    } catch (error) {
      console.error('Error getting member projects:', error);
      throw error;
    }
  }

  /**
   * Get project members
   * @param projectId The project identifier
   * @returns Array of member addresses
   */
  async getProjectMembers(projectId: string): Promise<string[]> {
    try {
      return await this.contract.getProjectMembers(projectId);
    } catch (error) {
      console.error('Error getting project members:', error);
      throw error;
    }
  }

  /**
   * Get credibility score
   * @param member Member address
   * @returns Credibility score
   */
  async getCredibilityScore(member: string): Promise<number> {
    try {
      const score = await this.contract.getCredibilityScore(member);
      return Number(score);
    } catch (error) {
      console.error('Error getting credibility score:', error);
      throw error;
    }
  }

  /**
   * Get milestone status
   * @param projectId The project identifier
   * @param milestoneId Milestone identifier
   * @returns Milestone details
   */
  async getMilestone(projectId: string, milestoneId: number): Promise<Milestone> {
    try {
      const result = await this.contract.getMilestone(projectId, milestoneId);
      return {
        description: result[0],
        confirmed: result[1],
        confirmations: Number(result[2]),
        deadline: Number(result[3])
      };
    } catch (error) {
      console.error('Error getting milestone:', error);
      throw error;
    }
  }

  /**
   * Get all projects
   * @returns Array of all project IDs
   */
  async getAllProjects(): Promise<string[]> {
    try {
      return await this.contract.getAllProjects();
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  }

  /**
   * Get all roles of a project
   * @param projectId The project identifier
   * @returns Array of member addresses and their roles
   */
  async getProjectRoles(projectId: string): Promise<ProjectRole[]> {
    try {
      const [members, roles] = await this.contract.getProjectRoles(projectId);
      const result: ProjectRole[] = [];
      for (let i = 0; i < members.length; i++) {
        result.push({
          member: members[i],
          role: roles[i]
        });
      }
      return result;
    } catch (error) {
      console.error('Error getting project roles:', error);
      throw error;
    }
  }

  /**
   * Get dispute details
   * @param disputeId Dispute identifier
   * @returns Dispute details
   */
  async getDispute(disputeId: string): Promise<Dispute> {
    try {
      const result = await this.contract.getDispute(disputeId);
      return {
        disputer: result[0],
        target: result[1],
        reason: result[2],
        createdAt: Number(result[3]),
        resolved: result[4],
        inFavorOfDisputer: result[5],
        votesForDisputer: Number(result[6]),
        votesForTarget: Number(result[7]),
        voters: result[8]
      };
    } catch (error) {
      console.error('Error getting dispute:', error);
      throw error;
    }
  }

  /**
   * Get member statistics
   * @param member Member address
   * @returns Member statistics
   */
  async getMemberStats(member: string): Promise<MemberStats> {
    try {
      const result = await this.contract.getMemberStats(member);
      return {
        projectsShipped: Number(result[0]),
        onTimeRateScore: Number(result[1]),
        budgetAccuracyScore: Number(result[2]),
        abandoned: Number(result[3]),
        lastProject: Number(result[4])
      };
    } catch (error) {
      console.error('Error getting member stats:', error);
      throw error;
    }
  }

  /**
   * Get portable reputation
   * @param member Member address
   * @returns Portable reputation data
   */
  async getPortableReputation(member: string): Promise<PortableReputation> {
    try {
      const result = await this.contract.getPortableReputation(member);
      return {
        score: Number(result[0]),
        lastUpdated: Number(result[1]),
        projectsShipped: Number(result[2]),
        onTimeRate: Number(result[3]),
        budgetAccuracy: Number(result[4]),
        projectsAbandoned: Number(result[5]),
        projectProofs: result[6]
      };
    } catch (error) {
      console.error('Error getting portable reputation:', error);
      throw error;
    }
  }

  /**
   * Get minimum stake amount
   * @returns Minimum stake in ETH
   */
  async getMinStake(): Promise<string> {
    try {
      const minStake = await this.contract.MIN_STAKE();
      return formatEther(minStake);
    } catch (error) {
      console.error('Error getting min stake:', error);
      throw error;
    }
  }

  /**
   * Get reputation threshold
   * @returns Reputation threshold
   */
  async getReputationThreshold(): Promise<number> {
    try {
      const threshold = await this.contract.REPUTATION_THRESHOLD();
      return Number(threshold);
    } catch (error) {
      console.error('Error getting reputation threshold:', error);
      throw error;
    }
  }

  /**
   * Get disputer reward percentage
   * @returns Disputer reward percentage
   */
  async getDisputerRewardPercentage(): Promise<number> {
    try {
      const percentage = await this.contract.DISPUTER_REWARD_PERCENTAGE();
      return Number(percentage);
    } catch (error) {
      console.error('Error getting disputer reward percentage:', error);
      throw error;
    }
  }

  /**
   * Get slash percentage
   * @returns Slash percentage
   */
  async getSlashPercentage(): Promise<number> {
    try {
      const percentage = await this.contract.SLASH_PERCENTAGE();
      return Number(percentage);
    } catch (error) {
      console.error('Error getting slash percentage:', error);
      throw error;
    }
  }

  /**
   * Get time decay period
   * @returns Time decay period
   */
  async getTimeDecayPeriod(): Promise<number> {
    try {
      const period = await this.contract.TIME_DECAY_PERIOD();
      return Number(period);
    } catch (error) {
      console.error('Error getting time decay period:', error);
      throw error;
    }
  }

  /**
   * Get total project count
   * @returns Total number of projects
   */
  async getProjectCount(): Promise<number> {
    try {
      const count = await this.contract.projectCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting project count:', error);
      throw error;
    }
  }

  /**
   * Get total dispute count
   * @returns Total number of disputes
   */
  async getDisputeCount(): Promise<number> {
    try {
      const count = await this.contract.disputeCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting dispute count:', error);
      throw error;
    }
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get signer from connected wallet
 * @returns Ethers signer or null if not connected
 */
export async function getSigner(): Promise<ethers.Signer | null> {
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Create provider and signer
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    return signer;
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
}

/**
 * Create SquadTrust service instance
 * @param contractAddress Contract address
 * @param signer Ethers signer from wallet connection
 * @returns SquadTrustService instance
 */
export function createSquadTrustService(contractAddress: string, signer: ethers.Signer): SquadTrustService {
  return new SquadTrustService(contractAddress, signer);
}

/**
 * Validate ethereum address
 * @param address Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Format ETH amount for display
 * @param amount Amount in wei
 * @returns Formatted ETH amount
 */
export function formatEthAmount(amount: string): string {
  return formatEther(amount);
}

/**
 * Parse ETH amount to wei
 * @param amount Amount in ETH
 * @returns Amount in wei
 */
export function parseEthAmount(amount: string): string {
  return parseEther(amount).toString();
}

// ============ EVENT TYPES ============

export interface ProjectCreatedEvent {
  projectId: string;
  creator: string;
  name: string;
  timestamp: number;
}

export interface ProjectCompletedEvent {
  projectId: string;
  team: string;
  credibilityImpact: number;
  timestamp: number;
}

export interface RoleVerifiedEvent {
  member: string;
  projectId: string;
  role: string;
  timestamp: number;
}

export interface MilestoneConfirmedEvent {
  projectId: string;
  milestoneId: number;
  confirmer: string;
  confirmations: number;
}

// ============ ERROR HANDLING ============

export class SquadTrustError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SquadTrustError';
  }
}

/**
 * Handle contract errors
 * @param error Error object
 * @returns User-friendly error message
 */
export function handleContractError(error: any): string {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  
  if (error.reason) {
    return error.reason;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
