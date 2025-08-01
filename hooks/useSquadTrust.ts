import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  SquadTrustService, 
  createSquadTrustService,
  Project,
  MemberRole,
  Milestone,
  ProjectRole,
  Dispute,
  MemberStats,
  PortableReputation,
  handleContractError,
  SquadTrustError
} from '../lib/contract';

interface UseSquadTrustProps {
  contractAddress: string;
  signer?: ethers.Signer;
}

interface UseSquadTrustReturn {
  // Service instance
  squadTrustService?: SquadTrustService;
  
  // Loading states
  isLoading: boolean;
  isCreatingProject: boolean;
  isClaimingRole: boolean;
  isVerifyingRole: boolean;
  isConfirmingMilestone: boolean;
  isCompletingProject: boolean;
  isWithdrawingStake: boolean;
  isAbandoningProject: boolean;
  isCreatingDispute: boolean;
  isVotingOnDispute: boolean;
  isSlashingStake: boolean;
  
  // Error state
  error: string | null;
  
  // Core functions
  createProject: (name: string, requiredConfirmations: number, budget: string, deadline: number) => Promise<string>;
  claimRole: (projectId: string, role: string) => Promise<void>;
  verifyRole: (projectId: string, member: string) => Promise<void>;
  verifyRoleBySig: (member: string, projectId: string, role: string, v: number, r: string, s: string) => Promise<void>;
  confirmMilestone: (projectId: string, milestoneId: number, description: string) => Promise<void>;
  completeProject: (projectId: string, actualCost: string) => Promise<void>;
  abandonProject: (projectId: string) => Promise<void>;
  withdrawStake: (projectId: string) => Promise<void>;
  
  // Dispute Resolution
  createDispute: (projectId: string, target: string, reason: string) => Promise<void>;
  voteOnDispute: (disputeId: string, voteForDisputer: boolean) => Promise<void>;
  slashStake: (projectId: string, member: string) => Promise<void>;
  
  // View functions
  getProject: (projectId: string) => Promise<Project>;
  getMemberRole: (projectId: string, member: string) => Promise<MemberRole | null>;
  getMemberProjects: (member: string) => Promise<string[]>;
  getProjectMembers: (projectId: string) => Promise<string[]>;
  getCredibilityScore: (member: string) => Promise<number>;
  getMilestone: (projectId: string, milestoneId: number) => Promise<Milestone>;
  getAllProjects: () => Promise<string[]>;
  getProjectRoles: (projectId: string) => Promise<ProjectRole[]>;
  getDispute: (disputeId: string) => Promise<Dispute>;
  getMemberStats: (member: string) => Promise<MemberStats>;
  getPortableReputation: (member: string) => Promise<PortableReputation>;
  getMinStake: () => Promise<string>;
  getReputationThreshold: () => Promise<number>;
  getDisputerRewardPercentage: () => Promise<number>;
  getSlashPercentage: () => Promise<number>;
  getTimeDecayPeriod: () => Promise<number>;
  getProjectCount: () => Promise<number>;
  getDisputeCount: () => Promise<number>;
  
  // Utility functions
  clearError: () => void;
  isConnected: boolean;
}

export function useSquadTrust({ contractAddress, signer }: UseSquadTrustProps): UseSquadTrustReturn {
  const [squadTrustService, setSquadTrustService] = useState<SquadTrustService>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isClaimingRole, setIsClaimingRole] = useState(false);
  const [isVerifyingRole, setIsVerifyingRole] = useState(false);
  const [isConfirmingMilestone, setIsConfirmingMilestone] = useState(false);
  const [isCompletingProject, setIsCompletingProject] = useState(false);
  const [isWithdrawingStake, setIsWithdrawingStake] = useState(false);
  const [isAbandoningProject, setIsAbandoningProject] = useState(false);
  const [isCreatingDispute, setIsCreatingDispute] = useState(false);
  const [isVotingOnDispute, setIsVotingOnDispute] = useState(false);
  const [isSlashingStake, setIsSlashingStake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!signer;

  // Initialize service when signer is available
  useEffect(() => {
    if (signer && contractAddress) {
      try {
        const service = createSquadTrustService(contractAddress, signer);
        setSquadTrustService(service);
        setError(null);
      } catch (err) {
        setError('Failed to initialize SquadTrust service');
        console.error('Error initializing SquadTrust service:', err);
      }
    } else {
      setSquadTrustService(undefined);
    }
  }, [signer, contractAddress]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Wrapper functions with loading states and error handling
  const createProject = useCallback(async (name: string, requiredConfirmations: number, budget: string, deadline: number): Promise<string> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsCreatingProject(true);
    setError(null);

    try {
      const result = await squadTrustService.createProject(name, requiredConfirmations, budget, deadline);
      return result.projectId;
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsCreatingProject(false);
    }
  }, [squadTrustService]);

  const claimRole = useCallback(async (projectId: string, role: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsClaimingRole(true);
    setError(null);

    try {
      await squadTrustService.claimRole(projectId, role);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsClaimingRole(false);
    }
  }, [squadTrustService]);

  const verifyRole = useCallback(async (projectId: string, member: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsVerifyingRole(true);
    setError(null);

    try {
      await squadTrustService.verifyRole(projectId, member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsVerifyingRole(false);
    }
  }, [squadTrustService]);

  const verifyRoleBySig = useCallback(async (member: string, projectId: string, role: string, v: number, r: string, s: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsVerifyingRole(true); // Reusing isVerifyingRole for now, as it's a role verification
    setError(null);

    try {
      await squadTrustService.verifyRoleBySig(member, projectId, role, v, r, s);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsVerifyingRole(false);
    }
  }, [squadTrustService]);

  const confirmMilestone = useCallback(async (projectId: string, milestoneId: number, description: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsConfirmingMilestone(true);
    setError(null);

    try {
      await squadTrustService.confirmMilestone(projectId, milestoneId, description);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsConfirmingMilestone(false);
    }
  }, [squadTrustService]);

  const completeProject = useCallback(async (projectId: string, actualCost: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsCompletingProject(true);
    setError(null);

    try {
      await squadTrustService.completeProject(projectId, actualCost);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsCompletingProject(false);
    }
  }, [squadTrustService]);

  const abandonProject = useCallback(async (projectId: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsAbandoningProject(true);
    setError(null);

    try {
      await squadTrustService.abandonProject(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsAbandoningProject(false);
    }
  }, [squadTrustService]);

  const withdrawStake = useCallback(async (projectId: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsWithdrawingStake(true);
    setError(null);

    try {
      await squadTrustService.withdrawStake(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsWithdrawingStake(false);
    }
  }, [squadTrustService]);

  // Dispute Resolution
  const createDispute = useCallback(async (projectId: string, target: string, reason: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsCreatingDispute(true);
    setError(null);

    try {
      await squadTrustService.createDispute(projectId, target, reason);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsCreatingDispute(false);
    }
  }, [squadTrustService]);

  const voteOnDispute = useCallback(async (disputeId: string, voteForDisputer: boolean): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsVotingOnDispute(true);
    setError(null);

    try {
      await squadTrustService.voteOnDispute(disputeId, voteForDisputer);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsVotingOnDispute(false);
    }
  }, [squadTrustService]);

  const slashStake = useCallback(async (projectId: string, member: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsSlashingStake(true);
    setError(null);

    try {
      await squadTrustService.slashStake(projectId, member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsSlashingStake(false);
    }
  }, [squadTrustService]);

  // View functions (read-only, no loading states needed)
  const getProject = useCallback(async (projectId: string): Promise<Project> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getProject(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getMemberRole = useCallback(async (projectId: string, member: string): Promise<MemberRole | null> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getMemberRole(projectId, member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getMemberProjects = useCallback(async (member: string): Promise<string[]> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getMemberProjects(member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getProjectMembers = useCallback(async (projectId: string): Promise<string[]> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getProjectMembers(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getCredibilityScore = useCallback(async (member: string): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getCredibilityScore(member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getMilestone = useCallback(async (projectId: string, milestoneId: number): Promise<Milestone> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getMilestone(projectId, milestoneId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getAllProjects = useCallback(async (): Promise<string[]> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getAllProjects();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getProjectRoles = useCallback(async (projectId: string): Promise<ProjectRole[]> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getProjectRoles(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getDispute = useCallback(async (disputeId: string): Promise<Dispute> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getDispute(disputeId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getMemberStats = useCallback(async (member: string): Promise<MemberStats> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getMemberStats(member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getPortableReputation = useCallback(async (member: string): Promise<PortableReputation> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getPortableReputation(member);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getMinStake = useCallback(async (): Promise<string> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getMinStake();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getReputationThreshold = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getReputationThreshold();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getDisputerRewardPercentage = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getDisputerRewardPercentage();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getSlashPercentage = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getSlashPercentage();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getTimeDecayPeriod = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getTimeDecayPeriod();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getProjectCount = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getProjectCount();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  const getDisputeCount = useCallback(async (): Promise<number> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    try {
      return await squadTrustService.getDisputeCount();
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    }
  }, [squadTrustService]);

  return {
    squadTrustService,
    isLoading: isCreatingProject || isClaimingRole || isVerifyingRole || isConfirmingMilestone || isCompletingProject || isWithdrawingStake || isAbandoningProject || isCreatingDispute || isVotingOnDispute || isSlashingStake,
    isCreatingProject,
    isClaimingRole,
    isVerifyingRole,
    isConfirmingMilestone,
    isCompletingProject,
    isWithdrawingStake,
    isAbandoningProject,
    isCreatingDispute,
    isVotingOnDispute,
    isSlashingStake,
    error,
    createProject,
    claimRole,
    verifyRole,
    verifyRoleBySig,
    confirmMilestone,
    completeProject,
    abandonProject,
    withdrawStake,
    createDispute,
    voteOnDispute,
    slashStake,
    getProject,
    getMemberRole,
    getMemberProjects,
    getProjectMembers,
    getCredibilityScore,
    getMilestone,
    getAllProjects,
    getProjectRoles,
    getDispute,
    getMemberStats,
    getPortableReputation,
    getMinStake,
    getReputationThreshold,
    getDisputerRewardPercentage,
    getSlashPercentage,
    getTimeDecayPeriod,
    getProjectCount,
    getDisputeCount,
    clearError,
    isConnected
  };
} 