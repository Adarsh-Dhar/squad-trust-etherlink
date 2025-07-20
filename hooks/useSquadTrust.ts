import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  SquadTrustService, 
  createSquadTrustService,
  Project,
  MemberRole,
  Milestone,
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
  
  // Error state
  error: string | null;
  
  // Core functions
  createProject: (name: string, requiredConfirmations: number) => Promise<string>;
  claimRole: (projectId: string, role: string, stakeAmount: string) => Promise<void>;
  verifyRole: (projectId: string, member: string) => Promise<void>;
  confirmMilestone: (projectId: string, milestoneId: number, description: string) => Promise<void>;
  completeProject: (projectId: string) => Promise<void>;
  withdrawStake: (projectId: string) => Promise<void>;
  
  // View functions
  getProject: (projectId: string) => Promise<Project>;
  getMemberRole: (projectId: string, member: string) => Promise<MemberRole>;
  getMemberProjects: (member: string) => Promise<string[]>;
  getProjectMembers: (projectId: string) => Promise<string[]>;
  getCredibilityScore: (member: string) => Promise<number>;
  getMilestone: (projectId: string, milestoneId: number) => Promise<Milestone>;
  getAllProjects: () => Promise<string[]>;
  getMinStake: () => Promise<string>;
  getProjectCount: () => Promise<number>;
  
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
  const createProject = useCallback(async (name: string, requiredConfirmations: number): Promise<string> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsCreatingProject(true);
    setError(null);

    try {
      const projectId = await squadTrustService.createProject(name, requiredConfirmations);
      return projectId;
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsCreatingProject(false);
    }
  }, [squadTrustService]);

  const claimRole = useCallback(async (projectId: string, role: string, stakeAmount: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsClaimingRole(true);
    setError(null);

    try {
      await squadTrustService.claimRole(projectId, role, stakeAmount);
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

  const completeProject = useCallback(async (projectId: string): Promise<void> => {
    if (!squadTrustService) {
      throw new SquadTrustError('Wallet not connected');
    }

    setIsCompletingProject(true);
    setError(null);

    try {
      await squadTrustService.completeProject(projectId);
    } catch (err) {
      const errorMessage = handleContractError(err);
      setError(errorMessage);
      throw new SquadTrustError(errorMessage);
    } finally {
      setIsCompletingProject(false);
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

  const getMemberRole = useCallback(async (projectId: string, member: string): Promise<MemberRole> => {
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

  return {
    squadTrustService,
    isLoading: isCreatingProject || isClaimingRole || isVerifyingRole || isConfirmingMilestone || isCompletingProject || isWithdrawingStake,
    isCreatingProject,
    isClaimingRole,
    isVerifyingRole,
    isConfirmingMilestone,
    isCompletingProject,
    isWithdrawingStake,
    error,
    createProject,
    claimRole,
    verifyRole,
    confirmMilestone,
    completeProject,
    withdrawStake,
    getProject,
    getMemberRole,
    getMemberProjects,
    getProjectMembers,
    getCredibilityScore,
    getMilestone,
    getAllProjects,
    getMinStake,
    getProjectCount,
    clearError,
    isConnected
  };
} 