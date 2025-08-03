import { ethers, parseEther, formatEther, isAddress, BrowserProvider } from 'ethers';
import { abi } from './abi';
import { squadtrust_address as contractAddress } from './address';

// ========== CONTRACT STRUCTS ==========
export interface Project {
  creator: string;
  name: string;
  totalReward: string;
  minTeamStake: string;
  funded: boolean;
  completed: boolean;
  teamHired: boolean;
  createdAt: number;
}

export interface Team {
  leader: string;
  name: string;
  members: string[];
  stakedAmount: string;
  hired: boolean;
  exists: boolean;
}

export interface Milestone {
  title: string;
  deadline: number;
  compensation: string;
  completed: boolean;
  rewarded: boolean;
}

export interface Application {
  teamId: string;
  stakedAmount: string;
  accepted: boolean;
  applicant: string;
}

// ========== ENUMS ==========
export enum ProjectStatus {
  HIRING = 0,
  HIRED = 1,
  FINISHED = 2
}

export enum ProjectType {
  HACKATHON = 0,
  STARTUP = 1,
  ENTERPRISE = 2
}

export enum TeamMemberRole {
  ADMIN = 0,
  MEMBER = 1
}

// ========== EVENTS ==========
export interface ProjectCreatedEvent {
  projectId: string;
  creator: string;
  name: string;
}

export interface TeamCreatedEvent {
  teamId: string;
  leader: string;
  name: string;
}

export interface ProjectFundedEvent {
  projectId: string;
  amount: string;
}

export interface AppliedForProjectEvent {
  projectId: string;
  teamId: string;
  stake: string;
}

export interface TeamHiredEvent {
  projectId: string;
  teamId: string;
}

export interface MilestoneCreatedEvent {
  projectId: string;
  milestoneId: number;
  title: string;
}

export interface MilestoneCompletedEvent {
  projectId: string;
  milestoneId: number;
}

export interface RewardReleasedEvent {
  projectId: string;
  milestoneId: number;
  amount: string;
}

export interface ProjectCompletedEvent {
  projectId: string;
}

// ========== ADDITIONAL TYPES ==========
export interface MemberRole {
  verified: boolean;
  stakeAmount: string;
}

export interface ProjectRole {
  id: string;
  roleTitle: string;
  description: string;
  verified: boolean;
}

export interface Dispute {
  id: string;
  projectId: string;
  target: string;
  reason: string;
  status: string;
}

export interface MemberStats {
  projectsShipped: number;
  onTimeRate: number;
  budgetAccuracy: number;
  abandonedProjects: number;
  credibilityScore: number;
}

export interface PortableReputation {
  member: string;
  stats: MemberStats;
  timestamp: number;
}

// ========== CONTRACT INTERFACE ==========
export interface SquadTrustContract {
  // Core Functions
  createProject(name: string, minTeamStake: string): Promise<{ projectId: string; txHash: string }>;
  createTeam(name: string, members: string[]): Promise<{ teamId: string; txHash: string }>;
  fundProject(projectId: string, amount: string): Promise<string>;
  applyForProject(projectId: string, teamId: string, stake: string): Promise<void>;
  hireTeam(projectId: string, teamId: string): Promise<void>;
  createMilestone(projectId: string, title: string, deadline: number, compensation: string): Promise<void>;
  submitMilestoneCompletion(projectId: string, milestoneId: number): Promise<void>;
  approveMilestone(projectId: string, milestoneId: number): Promise<void>;
  completeProject(projectId: string): Promise<void>;
  finishProject(projectId: string): Promise<void>;
  withdrawFromVault(teamId: string): Promise<void>;
  
  // View Functions
  getProject(projectId: string): Promise<Project>;
  getTeam(teamId: string): Promise<Team>;
  getProjectMilestones(projectId: string): Promise<Milestone[]>;
  getProjectApplications(projectId: string): Promise<Application[]>;
  getTeamMembers(teamId: string): Promise<string[]>;
  getProjectsCount(): Promise<number>;
  getTeamsCount(): Promise<number>;
  getProjectById(index: number): Promise<string>;
  getTeamById(index: number): Promise<string>;
  getHiredTeam(projectId: string): Promise<string>;
  isTeamMember(teamId: string, member: string): Promise<boolean>;
  getVaultBalance(): Promise<string>;
  
  // Constants
  DISPUTE_FEE(): Promise<string>;
  SLASH_PERCENTAGE(): Promise<number>;
  vault(): Promise<string>;
  vaultBalance(): Promise<string>;
}

export class SquadTrustService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private contractAddress: string;

  constructor(contractAddressParam: string = contractAddress, signer: ethers.Signer) {
    this.signer = signer;
    this.contractAddress = contractAddressParam;
    this.contract = new ethers.Contract(contractAddressParam, abi, signer);
  }

  // ============ CORE FUNCTIONS ============

  /**
   * Create a new project
   * @param name Project name
   * @param minTeamStake Minimum team stake in ETH (e.g., "0.1")
   * @returns Object containing projectId and txHash
   */
  async createProject(name: string, minTeamStake: string): Promise<{ projectId: string; txHash: string }> {
    console.log("Creating project:", name, minTeamStake);
    console.log("Contract address:", this.contractAddress);
    console.log("Signer address:", await this.signer.getAddress());
    
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error("Project name is required");
    }
    
    if (!minTeamStake || parseFloat(minTeamStake) <= 0) {
      throw new Error("Minimum team stake must be greater than 0");
    }
    
    // Convert minTeamStake to Wei
    const minTeamStakeWei = ethers.parseEther(minTeamStake);
    console.log("Min team stake in Wei:", minTeamStakeWei.toString());
    
    try {
      // First, check if contract is deployed
      const code = await this.signer.provider?.getCode(this.contractAddress);
      if (code === "0x") {
        throw new Error(`Contract not deployed at address ${this.contractAddress}. Please check your contract address and network.`);
      }
      
      // Check if contract has the required function
      try {
        await this.contract.getProjectsCount();
      } catch (e: any) {
        throw new Error(`Contract at ${this.contractAddress} does not have the required functions. Please check if this is the correct SquadTrust contract.`);
      }
      
      // Create the project
      const tx = await this.contract.createProject(name, minTeamStakeWei);
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // Try to get project ID from logs
      let projectId: string | null = null;
      
      if (receipt.logs && receipt.logs.length > 0) {
        console.log("Transaction logs found:", receipt.logs.length);
        
        // Look for ProjectCreated event
        for (const log of receipt.logs) {
          try {
            const parsedLog = this.contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === "ProjectCreated") {
              projectId = parsedLog.args[0]; // projectId is the first argument
              console.log("ProjectCreated event found:", parsedLog.args);
              break;
            }
          } catch (e) {
            // Skip logs that can't be parsed
            continue;
          }
        }
      }
      
      if (!projectId) {
        console.log("No ProjectCreated event found, trying fallback method...");
        
        // Fallback: try to get the project ID by checking the projects count
        try {
          const projectCount = await this.contract.getProjectsCount();
          console.log("Current project count:", projectCount.toString());
          
          // The new project should be at index projectCount - 1
          if (projectCount > BigInt(0)) {
            const projectIndex = projectCount - BigInt(1);
            const projectData = await this.contract.getProject(projectIndex);
            projectId = projectIndex.toString();
            console.log("Project found at index:", projectIndex.toString());
          }
        } catch (e: any) {
          console.log("Fallback method failed:", e.message);
        }
      }
      
      if (!projectId) {
        console.log("Project creation was successful, but couldn't retrieve project ID");
        console.log("Transaction hash:", tx.hash);
        throw new Error(`Project created successfully but couldn't retrieve project ID. Transaction hash: ${tx.hash}. Please check the blockchain explorer for details.`);
      }
      
      return {
        projectId,
        txHash: tx.hash
      };
      
    } catch (error: any) {
      console.error("Error creating project:", error);
      
      // Provide more specific error messages
      if (error.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds in wallet to create project. Please add more ETH to your wallet.");
      } else if (error.message.includes("user rejected")) {
        throw new Error("Transaction was rejected by user. Please try again.");
      } else if (error.message.includes("nonce")) {
        throw new Error("Transaction nonce error. Please refresh and try again.");
      } else if (error.message.includes("gas")) {
        throw new Error("Gas estimation failed. Please check your network connection and try again.");
      } else {
        throw new Error(`Failed to create project: ${error.message}`);
      }
    }
  }

  /**
   * Create a new team
   * @param name Team name
   * @param members Array of team member addresses
   * @returns Object containing teamId and txHash
   */
  async createTeam(name: string, members: string[]): Promise<{ teamId: string; txHash: string }> {
    try {
      console.log("Creating team:", name, members);
      
      const tx = await this.contract.createTeam(name, members);
      console.log("🚀 Transaction sent! Hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
      console.log("📋 Transaction hash:", tx.hash);
      
      // Try to get the teamId from the transaction receipt
      if (receipt.logs && receipt.logs.length > 0) {
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          try {
            const parsedLog = this.contract.interface.parseLog(log);
            if (parsedLog?.name === 'TeamCreated') {
              const teamId = parsedLog.args.teamId.toString();
              console.log("🎉 Found TeamCreated event with teamId:", teamId);
              console.log("🔗 Transaction hash:", tx.hash);
              return { teamId, txHash: tx.hash };
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      throw new Error("Could not determine team ID from transaction. Team creation failed.");
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Fund a project
   * @param projectId The project identifier
   * @param amount Funding amount in ETH (e.g., "1.0")
   * @returns Transaction hash
   */
  async fundProject(projectId: string, amount: string): Promise<string> {
    try {
      const amountWei = parseEther(amount);
      const tx = await this.contract.fundProject(projectId, { value: amountWei });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error funding project:', error);
      throw error;
    }
  }

  /**
   * Apply for a project with stake
   * @param projectId The project identifier
   * @param teamId The team identifier
   * @param stake Stake amount in ETH (e.g., "0.1")
   */
  async applyForProject(projectId: string, teamId: string, stake: string): Promise<void> {
    try {
      const stakeWei = parseEther(stake);
      const tx = await this.contract.applyForProject(projectId, teamId, { value: stakeWei });
      await tx.wait();
    } catch (error) {
      console.error('Error applying for project:', error);
      throw error;
    }
  }

  /**
   * Hire a team for a project
   * @param projectId The project identifier
   * @param teamId The team identifier
   */
  async hireTeam(projectId: string, teamId: string): Promise<void> {
    try {
      const tx = await this.contract.hireTeam(projectId, teamId);
      await tx.wait();
    } catch (error) {
      console.error('Error hiring team:', error);
      throw error;
    }
  }

  /**
   * Create a milestone for a project
   * @param projectId The project identifier
   * @param title Milestone title
   * @param deadline Deadline as Unix timestamp
   * @param compensation Compensation amount in ETH (e.g., "0.5")
   */
  async createMilestone(projectId: string, title: string, deadline: number, compensation: string): Promise<void> {
    try {
      const compensationWei = parseEther(compensation);
      const tx = await this.contract.createMilestone(projectId, title, deadline, compensationWei);
      await tx.wait();
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Submit milestone completion
   * @param projectId The project identifier
   * @param milestoneId Milestone identifier
   */
  async submitMilestoneCompletion(projectId: string, milestoneId: number): Promise<void> {
    try {
      const tx = await this.contract.submitMilestoneCompletion(projectId, milestoneId);
      await tx.wait();
    } catch (error) {
      console.error('Error submitting milestone completion:', error);
      throw error;
    }
  }

  /**
   * Approve milestone and release reward
   * @param projectId The project identifier
   * @param milestoneId Milestone identifier
   */
  async approveMilestone(projectId: string, milestoneId: number): Promise<void> {
    try {
      const tx = await this.contract.approveMilestone(projectId, milestoneId);
      await tx.wait();
    } catch (error) {
      console.error('Error approving milestone:', error);
      throw error;
    }
  }

  /**
   * Complete a project
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
   * Finish a project (mark as fully completed)
   * @param projectId The project identifier
   */
  async finishProject(projectId: string): Promise<void> {
    try {
      const tx = await this.contract.finishProject(projectId);
      await tx.wait();
    } catch (error) {
      console.error('Error finishing project:', error);
      throw error;
    }
  }

  /**
   * Withdraw from vault (only vault can call)
   * @param teamId The team identifier
   */
  async withdrawFromVault(teamId: string): Promise<void> {
    try {
      const tx = await this.contract.withdrawFromVault(teamId);
      await tx.wait();
    } catch (error) {
      console.error('Error withdrawing from vault:', error);
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
      const result = await this.contract.projects(projectId);
      return {
        creator: result[0],
        name: result[1],
        totalReward: formatEther(result[2]),
        minTeamStake: formatEther(result[3]),
        funded: result[4],
        completed: result[5],
        teamHired: result[6],
        createdAt: Number(result[7])
      };
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  /**
   * Get team details
   * @param teamId The team identifier
   * @returns Team details
   */
  async getTeam(teamId: string): Promise<Team> {
    try {
      const result = await this.contract.teams(teamId);
      console.log('Raw team result from contract:', result);
      
      // Check if result[3] is a valid BigNumber before formatting
      let stakedAmount = "0";
      try {
        if (result[3] && typeof result[3] === 'object' && result[3]._isBigNumber) {
          stakedAmount = formatEther(result[3]);
        } else if (typeof result[3] === 'string' || typeof result[3] === 'number') {
          stakedAmount = formatEther(result[3].toString());
        }
      } catch (formatError) {
        console.warn('Could not format staked amount:', result[3], formatError);
        stakedAmount = "0";
      }
      
      // Determine if team exists based on leader address
      const leader = result[0];
      const exists = leader && leader !== '0x0000000000000000000000000000000000000000';
      
      return {
        leader: result[0],
        name: result[1],
        members: result[2],
        stakedAmount: stakedAmount,
        hired: result[4],
        exists: exists
      };
    } catch (error) {
      console.error('Error getting team:', error);
      throw error;
    }
  }

  /**
   * Get project milestones
   * @param projectId The project identifier
   * @returns Array of milestones
   */
  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const milestones = await this.contract.getProjectMilestones(projectId);
      return milestones.map((milestone: any) => ({
        title: milestone[0],
        deadline: Number(milestone[1]),
        compensation: formatEther(milestone[2]),
        completed: milestone[3],
        rewarded: milestone[4]
      }));
    } catch (error) {
      console.error('Error getting project milestones:', error);
      throw error;
    }
  }

  /**
   * Get project applications
   * @param projectId The project identifier
   * @returns Array of applications
   */
  async getProjectApplications(projectId: string): Promise<Application[]> {
    try {
      const applications = await this.contract.getProjectApplications(projectId);
      return applications.map((application: any) => ({
        teamId: application[0],
        stakedAmount: formatEther(application[1]),
        accepted: application[2],
        applicant: application[3]
      }));
    } catch (error) {
      console.error('Error getting project applications:', error);
      throw error;
    }
  }

  /**
   * Get team members
   * @param teamId The team identifier
   * @returns Array of member addresses
   */
  async getTeamMembers(teamId: string): Promise<string[]> {
    try {
      return await this.contract.getTeamMembers(teamId);
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  /**
   * Get total projects count
   * @returns Total number of projects
   */
  async getProjectsCount(): Promise<number> {
    try {
      const count = await this.contract.getProjectsCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting projects count:', error);
      throw error;
    }
  }

  /**
   * Get total teams count
   * @returns Total number of teams
   */
  async getTeamsCount(): Promise<number> {
    try {
      const count = await this.contract.getTeamsCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting teams count:', error);
      throw error;
    }
  }

  /**
   * Get project by index
   * @param index Project index
   * @returns Project ID
   */
  async getProjectById(index: number): Promise<string> {
    try {
      return await this.contract.getProjectById(index);
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw error;
    }
  }

  /**
   * Get team by index
   * @param index Team index
   * @returns Team ID
   */
  async getTeamById(index: number): Promise<string> {
    try {
      return await this.contract.getTeamById(index);
    } catch (error) {
      console.error('Error getting team by ID:', error);
      throw error;
    }
  }

  /**
   * Get hired team for project
   * @param projectId The project identifier
   * @returns Team ID of hired team
   */
  async getHiredTeam(projectId: string): Promise<string> {
    try {
      return await this.contract.getHiredTeam(projectId);
    } catch (error) {
      console.error('Error getting hired team:', error);
      throw error;
    }
  }

  /**
   * Check if address is team member
   * @param teamId The team identifier
   * @param member Member address
   * @returns True if member
   */
  async isTeamMember(teamId: string, member: string): Promise<boolean> {
    try {
      return await this.contract.isTeamMember(teamId, member);
    } catch (error) {
      console.error('Error checking team member:', error);
      throw error;
    }
  }

  /**
   * Get vault balance
   * @returns Vault balance in ETH
   */
  async getVaultBalance(): Promise<string> {
    try {
      const balance = await this.contract.getVaultBalance();
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting vault balance:', error);
      throw error;
    }
  }

  /**
   * Get dispute fee
   * @returns Dispute fee in ETH
   */
  async getDisputeFee(): Promise<string> {
    try {
      const fee = await this.contract.DISPUTE_FEE();
      return formatEther(fee);
    } catch (error) {
      console.error('Error getting dispute fee:', error);
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
   * Get vault address
   * @returns Vault address
   */
  async getVaultAddress(): Promise<string> {
    try {
      return await this.contract.vault();
    } catch (error) {
      console.error('Error getting vault address:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get all projects
   * @returns Array of all project IDs
   */
  async getAllProjects(): Promise<string[]> {
    try {
      const count = await this.getProjectsCount();
      const projects: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const projectId = await this.getProjectById(i);
        projects.push(projectId);
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  }

  /**
   * Get all teams
   * @returns Array of all team IDs
   */
  async getAllTeams(): Promise<string[]> {
    try {
      const count = await this.getTeamsCount();
      const teams: string[] = [];
      
      for (let i = 0; i < count; i++) {
        const teamId = await this.getTeamById(i);
        teams.push(teamId);
      }
      
      return teams;
    } catch (error) {
      console.error('Error getting all teams:', error);
      throw error;
    }
  }

  /**
   * Get projects for a creator
   * @param creator Creator address
   * @returns Array of project IDs
   */
  async getProjectsByCreator(creator: string): Promise<string[]> {
    try {
      const allProjects = await this.getAllProjects();
      const creatorProjects: string[] = [];
      
      for (const projectId of allProjects) {
        const project = await this.getProject(projectId);
        if (project.creator.toLowerCase() === creator.toLowerCase()) {
          creatorProjects.push(projectId);
        }
      }
      
      return creatorProjects;
    } catch (error) {
      console.error('Error getting projects by creator:', error);
      throw error;
    }
  }

  /**
   * Get teams for a leader
   * @param leader Leader address
   * @returns Array of team IDs
   */
  async getTeamsByLeader(leader: string): Promise<string[]> {
    try {
      const allTeams = await this.getAllTeams();
      const leaderTeams: string[] = [];
      
      for (const teamId of allTeams) {
        const team = await this.getTeam(teamId);
        if (team.leader.toLowerCase() === leader.toLowerCase()) {
          leaderTeams.push(teamId);
        }
      }
      
      return leaderTeams;
    } catch (error) {
      console.error('Error getting teams by leader:', error);
      throw error;
    }
  }

  /**
   * Get teams where user is a member
   * @param member Member address
   * @returns Array of team IDs
   */
  async getTeamsByMember(member: string): Promise<string[]> {
    try {
      const allTeams = await this.getAllTeams();
      const memberTeams: string[] = [];
      
      for (const teamId of allTeams) {
        const isMember = await this.isTeamMember(teamId, member);
        if (isMember) {
          memberTeams.push(teamId);
        }
      }
      
      return memberTeams;
    } catch (error) {
      console.error('Error getting teams by member:', error);
      throw error;
    }
  }

  /**
   * Withdraw stake from project (not yet implemented in contract)
   * @param projectId The project identifier
   */
  async withdrawStake(projectId: string): Promise<void> {
    throw new Error("withdrawStake method not yet implemented in the smart contract");
  }

  /**
   * Get member role for a project (not yet implemented in contract)
   * @param projectId The project identifier
   * @param member Member address
   * @returns Member role information or null
   */
  async getMemberRole(projectId: string, member: string): Promise<any> {
    throw new Error("getMemberRole method not yet implemented in the smart contract");
  }

  /**
   * Confirm milestone (not yet implemented in contract)
   * @param projectId The project identifier
   * @param milestoneId The milestone identifier
   * @param description Milestone description
   */
  async confirmMilestone(projectId: string, milestoneId: number, description: string): Promise<void> {
    throw new Error("confirmMilestone method not yet implemented in the smart contract");
  }

  /**
   * Claim role (not yet implemented in contract)
   * @param projectId The project identifier
   * @param role The role to claim
   */
  async claimRole(projectId: string, role: string): Promise<void> {
    throw new Error("claimRole method not yet implemented in the smart contract");
  }

  /**
   * Verify role (not yet implemented in contract)
   * @param projectId The project identifier
   * @param member The member to verify
   */
  async verifyRole(projectId: string, member: string): Promise<void> {
    throw new Error("verifyRole method not yet implemented in the smart contract");
  }

  /**
   * Verify role by signature (not yet implemented in contract)
   * @param member The member to verify
   * @param projectId The project identifier
   * @param role The role
   * @param v Signature v component
   * @param r Signature r component
   * @param s Signature s component
   */
  async verifyRoleBySig(member: string, projectId: string, role: string, v: number, r: string, s: string): Promise<void> {
    throw new Error("verifyRoleBySig method not yet implemented in the smart contract");
  }

  /**
   * Abandon project (not yet implemented in contract)
   * @param projectId The project identifier
   */
  async abandonProject(projectId: string): Promise<void> {
    throw new Error("abandonProject method not yet implemented in the smart contract");
  }

  /**
   * Create dispute (not yet implemented in contract)
   * @param projectId The project identifier
   * @param target The target of the dispute
   * @param reason The reason for the dispute
   */
  async createDispute(projectId: string, target: string, reason: string): Promise<void> {
    throw new Error("createDispute method not yet implemented in the smart contract");
  }

  /**
   * Vote on dispute (not yet implemented in contract)
   * @param disputeId The dispute identifier
   * @param voteForDisputer Whether to vote for the disputer
   */
  async voteOnDispute(disputeId: string, voteForDisputer: boolean): Promise<void> {
    throw new Error("voteOnDispute method not yet implemented in the smart contract");
  }

  /**
   * Slash stake (not yet implemented in contract)
   * @param projectId The project identifier
   * @param member The member to slash
   */
  async slashStake(projectId: string, member: string): Promise<void> {
    throw new Error("slashStake method not yet implemented in the smart contract");
  }

  /**
   * Get member projects (not yet implemented in contract)
   * @param member The member address
   * @returns Array of project IDs
   */
  async getMemberProjects(member: string): Promise<string[]> {
    throw new Error("getMemberProjects method not yet implemented in the smart contract");
  }

  /**
   * Get project members (not yet implemented in contract)
   * @param projectId The project identifier
   * @returns Array of member addresses
   */
  async getProjectMembers(projectId: string): Promise<string[]> {
    throw new Error("getProjectMembers method not yet implemented in the smart contract");
  }

  /**
   * Get credibility score (not yet implemented in contract)
   * @param member The member address
   * @returns Credibility score
   */
  async getCredibilityScore(member: string): Promise<number> {
    throw new Error("getCredibilityScore method not yet implemented in the smart contract");
  }

  /**
   * Get milestone (not yet implemented in contract)
   * @param projectId The project identifier
   * @param milestoneId The milestone identifier
   * @returns Milestone data
   */
  async getMilestone(projectId: string, milestoneId: number): Promise<any> {
    throw new Error("getMilestone method not yet implemented in the smart contract");
  }

  /**
   * Get project roles (not yet implemented in contract)
   * @param projectId The project identifier
   * @returns Array of project roles
   */
  async getProjectRoles(projectId: string): Promise<any[]> {
    throw new Error("getProjectRoles method not yet implemented in the smart contract");
  }

  /**
   * Get dispute (not yet implemented in contract)
   * @param disputeId The dispute identifier
   * @returns Dispute data
   */
  async getDispute(disputeId: string): Promise<any> {
    throw new Error("getDispute method not yet implemented in the smart contract");
  }

  /**
   * Get member stats (not yet implemented in contract)
   * @param member The member address
   * @returns Member statistics
   */
  async getMemberStats(member: string): Promise<any> {
    throw new Error("getMemberStats method not yet implemented in the smart contract");
  }

  /**
   * Get portable reputation (not yet implemented in contract)
   * @param member The member address
   * @returns Portable reputation data
   */
  async getPortableReputation(member: string): Promise<any> {
    throw new Error("getPortableReputation method not yet implemented in the smart contract");
  }

  /**
   * Get minimum stake (not yet implemented in contract)
   * @returns Minimum stake amount
   */
  async getMinStake(): Promise<string> {
    throw new Error("getMinStake method not yet implemented in the smart contract");
  }

  /**
   * Get reputation threshold (not yet implemented in contract)
   * @returns Reputation threshold
   */
  async getReputationThreshold(): Promise<number> {
    throw new Error("getReputationThreshold method not yet implemented in the smart contract");
  }

  /**
   * Get disputer reward percentage (not yet implemented in contract)
   * @returns Disputer reward percentage
   */
  async getDisputerRewardPercentage(): Promise<number> {
    throw new Error("getDisputerRewardPercentage method not yet implemented in the smart contract");
  }

  /**
   * Get time decay period (not yet implemented in contract)
   * @returns Time decay period
   */
  async getTimeDecayPeriod(): Promise<number> {
    throw new Error("getTimeDecayPeriod method not yet implemented in the smart contract");
  }

  /**
   * Get project count (not yet implemented in contract)
   * @returns Project count
   */
  async getProjectCount(): Promise<number> {
    throw new Error("getProjectCount method not yet implemented in the smart contract");
  }

  /**
   * Get dispute count (not yet implemented in contract)
   * @returns Dispute count
   */
  async getDisputeCount(): Promise<number> {
    throw new Error("getDisputeCount method not yet implemented in the smart contract");
  }
}

// ========== PROJECT CREATION SERVICE ==========

/**
 * Enhanced project creation service with full validation
 */
export class ProjectCreationService {
  private squadTrustService: SquadTrustService;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.squadTrustService = createSquadTrustService(contractAddress, signer);
  }

  /**
   * Create a project with full validation
   */
  async createProjectWithValidation(
    name: string, 
    minTeamStake: string,
    creatorAddress: string
  ): Promise<{ projectId: string; txHash: string; projectData: Project }> {
    
    // Step 1: Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error("Project name is required");
    }
    
    if (!minTeamStake || parseFloat(minTeamStake) <= 0) {
      throw new Error("Minimum team stake must be greater than 0");
    }

    // Step 2: Get initial project count
    const initialCount = await this.squadTrustService.getProjectsCount();
    console.log(`Initial projects count: ${initialCount}`);

    // Step 3: Create project on blockchain
    console.log("Creating project on blockchain...");
    const result = await this.squadTrustService.createProject(name, minTeamStake);
    console.log("Project creation transaction:", result);

    // Step 4: Verify project was created successfully
    const verificationResult = await this.verifyProjectCreation(
      result.projectId, 
      creatorAddress, 
      name,
      initialCount
    );

    if (!verificationResult.success) {
      throw new Error(`Project creation verification failed: ${verificationResult.error}`);
    }

    // Step 5: Get the full project data
    const projectData = await this.squadTrustService.getProject(result.projectId);

    return {
      projectId: result.projectId,
      txHash: result.txHash,
      projectData
    };
  }

  /**
   * Verify that a project was created successfully
   */
  private async verifyProjectCreation(
    projectId: string,
    expectedCreator: string,
    expectedName: string,
    initialCount: number
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      // Step 1: Verify project count increased
      const finalCount = await this.squadTrustService.getProjectsCount();
      if (finalCount <= initialCount) {
        return {
          success: false,
          error: `Project count did not increase. Expected > ${initialCount}, got ${finalCount}`
        };
      }

      // Step 2: Verify project exists and has correct data
      const projectData = await this.squadTrustService.getProject(projectId);
      
      if (!projectData) {
        return {
          success: false,
          error: "Project data not found on blockchain"
        };
      }

      // Step 3: Verify creator matches
      if (projectData.creator.toLowerCase() !== expectedCreator.toLowerCase()) {
        return {
          success: false,
          error: `Creator mismatch. Expected: ${expectedCreator}, Got: ${projectData.creator}`
        };
      }

      // Step 4: Verify project name matches
      if (projectData.name !== expectedName) {
        return {
          success: false,
          error: `Project name mismatch. Expected: ${expectedName}, Got: ${projectData.name}`
        };
      }

      // Step 5: Verify project is in correct initial state
      if (projectData.funded || projectData.completed || projectData.teamHired) {
        return {
          success: false,
          error: "Project is not in correct initial state"
        };
      }

      console.log("Project creation verification successful:", {
        projectId,
        creator: projectData.creator,
        name: projectData.name,
        funded: projectData.funded,
        completed: projectData.completed,
        teamHired: projectData.teamHired
      });

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate an existing project ID
   */
  async validateProjectId(
    projectId: string, 
    expectedCreator?: string
  ): Promise<{ valid: boolean; projectData?: Project; error?: string }> {
    
    try {
      // Check if projectId looks like a fallback ID
      if (projectId.startsWith('fallback_')) {
        return {
          valid: false,
          error: "Project ID is a fallback ID, not a real blockchain project"
        };
      }

      // Try to get project data from blockchain
      const projectData = await this.squadTrustService.getProject(projectId);
      
      if (!projectData) {
        return {
          valid: false,
          error: "Project not found on blockchain"
        };
      }

      // If expected creator is provided, verify it matches
      if (expectedCreator && projectData.creator.toLowerCase() !== expectedCreator.toLowerCase()) {
        return {
          valid: false,
          error: `Creator mismatch. Expected: ${expectedCreator}, Got: ${projectData.creator}`
        };
      }

      return {
        valid: true,
        projectData
      };

    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
    console.log("Getting signer...");
    
    // Check if MetaMask is available
    if (!window.ethereum) {
      console.error("MetaMask is not installed");
      throw new Error('MetaMask is not installed');
    }

    console.log("MetaMask is available");

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    console.log("Accounts requested:", accounts);

    if (!accounts || accounts.length === 0) {
      console.error("No accounts found");
      throw new Error('No accounts found');
    }

    console.log("Account found:", accounts[0]);

    // Create provider and signer
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    console.log("Signer created successfully");
    console.log("Signer address:", await signer.getAddress());
    
    return signer;
  } catch (error) {
    console.error('Error getting signer:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code
    });
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
