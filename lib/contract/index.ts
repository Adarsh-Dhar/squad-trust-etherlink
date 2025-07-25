import { ethers, parseEther, formatEther, isAddress, BrowserProvider, getBytes, formatBytes32String } from 'ethers';
import { abi } from './abi';
import { address as contractAddress } from './address';

// Contract ABI - you'll need to compile the contract and import the ABI
// For now, I'll define the essential types and interfaces

export interface Project {
  name: string;
  creator: string;
  completed: boolean;
  createdAt: number;
  completedAt: number;
  memberCount: number;
}

export interface MemberRole {
  role: string;
  verified: boolean;
  stakeAmount: string;
}

export interface Milestone {
  description: string;
  confirmed: boolean;
  confirmations: number;
}

export interface ProjectRole {
  member: string;
  role: string;
}

export interface SquadTrustContract {
  // Core Functions
  createProject(name: string, requiredConfirmations: number): Promise<string>;
  claimRole(projectId: string, role: string, stakeAmount: string): Promise<void>;
  verifyRole(projectId: string, member: string): Promise<void>;
  confirmMilestone(projectId: string, milestoneId: number, description: string): Promise<void>;
  completeProject(projectId: string): Promise<void>;
  withdrawStake(projectId: string): Promise<void>;
  
  // View Functions
  getProject(projectId: string): Promise<Project>;
  getMemberRole(projectId: string, member: string): Promise<MemberRole>;
  getMemberProjects(member: string): Promise<string[]>;
  getProjectMembers(projectId: string): Promise<string[]>;
  getCredibilityScore(member: string): Promise<number>;
  getMilestone(projectId: string, milestoneId: number): Promise<Milestone>;
  getAllProjects(): Promise<string[]>;
  getProjectRoles(projectId: string): Promise<ProjectRole[]>;
  
  // Constants
  MIN_STAKE(): Promise<string>;
  projectCount(): Promise<number>;
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
   * @returns Project ID
   */
  async createProject(name: string, requiredConfirmations: number): Promise<string> {
    try {
      console.log("Creating project:", name, requiredConfirmations);
      
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
      
      // Create project on blockchain - the function returns the projectId directly
      const tx = await this.contract.createProject(name, requiredConfirmations);
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
   * @param stakeAmount Stake amount in ETH (e.g., "0.01")
   */
  async claimRole(projectId: string, role: string, stakeAmount: string): Promise<void> {
    try {
      const value = parseEther(stakeAmount);
      const tx = await this.contract.claimRole(projectId, role, { value });
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
   */
  async completeProject(projectId: string): Promise<void> {
    try {
      const tx = await this.contract.completeProject(projectId);
      await tx.wait();
    } catch (error) {
      console.error('Error completing project:', error);
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
        createdAt: Number(result[3]),
        completedAt: Number(result[4]),
        memberCount: Number(result[5])
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
        stakeAmount: formatEther(result[2])
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
        confirmations: Number(result[2])
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
