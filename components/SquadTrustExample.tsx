'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSquadTrust } from '../hooks/useSquadTrust';

interface SquadTrustExampleProps {
  contractAddress: string;
  signer?: ethers.Signer;
}

export function SquadTrustExample({ contractAddress, signer }: SquadTrustExampleProps) {
  const [projectName, setProjectName] = useState('');
  const [requiredConfirmations, setRequiredConfirmations] = useState(2);
  const [roleDescription, setRoleDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.01');
  const [projectId, setProjectId] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [milestoneId, setMilestoneId] = useState(0);
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [minStake, setMinStake] = useState('0');
  const [projectCount, setProjectCount] = useState(0);
  const [allProjects, setAllProjects] = useState<string[]>([]);

  const {
    isLoading,
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
    getMinStake,
    getProjectCount,
    getAllProjects,
    clearError,
    isConnected
  } = useSquadTrust({ contractAddress, signer });

  // Load initial data
  useEffect(() => {
    if (isConnected) {
      loadInitialData();
    }
  }, [isConnected]);

  const loadInitialData = async () => {
    try {
      const [minStakeValue, projectCountValue, projects] = await Promise.all([
        getMinStake(),
        getProjectCount(),
        getAllProjects()
      ]);
      
      setMinStake(minStakeValue);
      setProjectCount(projectCountValue);
      setAllProjects(projects);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const handleCreateProject = async () => {
    try {
      const budget = "1000"; // Default budget in ETH
      const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
      const newProjectId = await createProject(projectName, requiredConfirmations, budget, deadline);
      setProjectId(newProjectId);
      setProjectName('');
      setRequiredConfirmations(2);
      await loadInitialData(); // Refresh project list
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const handleClaimRole = async () => {
    if (!projectId) {
      alert('Please create or select a project first');
      return;
    }

    try {
      await claimRole(projectId, roleDescription);
      setRoleDescription('');
      setStakeAmount('0.01');
    } catch (err) {
      console.error('Error claiming role:', err);
    }
  };

  const handleVerifyRole = async () => {
    if (!projectId || !memberAddress) {
      alert('Please provide project ID and member address');
      return;
    }

    try {
      await verifyRole(projectId, memberAddress);
      setMemberAddress('');
    } catch (err) {
      console.error('Error verifying role:', err);
    }
  };

  const handleConfirmMilestone = async () => {
    if (!projectId) {
      alert('Please create or select a project first');
      return;
    }

    try {
      await confirmMilestone(projectId, milestoneId, milestoneDescription);
      setMilestoneId(0);
      setMilestoneDescription('');
    } catch (err) {
      console.error('Error confirming milestone:', err);
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) {
      alert('Please create or select a project first');
      return;
    }

    try {
      const actualCost = "950"; // Default actual cost in ETH
      await completeProject(projectId, actualCost);
      setProjectId('');
      await loadInitialData(); // Refresh project list
    } catch (err) {
      console.error('Error completing project:', err);
    }
  };

  const handleWithdrawStake = async () => {
    if (!projectId) {
      alert('Please create or select a project first');
      return;
    }

    try {
      await withdrawStake(projectId);
    } catch (err) {
      console.error('Error withdrawing stake:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-yellow-700">
            Please connect your wallet to interact with SquadTrust.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SquadTrust Contract Interface</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Contract: {contractAddress}</span>
          <span>•</span>
          <span>Projects: {projectCount}</span>
          <span>•</span>
          <span>Min Stake: {minStake} ETH</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Create Project */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Confirmations
            </label>
            <input
              type="number"
              value={requiredConfirmations}
              onChange={(e) => setRequiredConfirmations(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>
        <button
          onClick={handleCreateProject}
          disabled={isCreatingProject || !projectName}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingProject ? 'Creating...' : 'Create Project'}
        </button>
        {projectId && (
          <p className="mt-2 text-sm text-gray-600">
            Project ID: <span className="font-mono">{projectId}</span>
          </p>
        )}
      </div>

      {/* Claim Role */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Description
            </label>
            <input
              type="text"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Frontend Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount (ETH)
            </label>
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.01"
            />
          </div>
        </div>
        <button
          onClick={handleClaimRole}
          disabled={isClaimingRole || !roleDescription || !projectId}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaimingRole ? 'Claiming...' : 'Claim Role'}
        </button>
      </div>

      {/* Verify Role */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verify Role</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Member Address
          </label>
          <input
            type="text"
            value={memberAddress}
            onChange={(e) => setMemberAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
          />
        </div>
        <button
          onClick={handleVerifyRole}
          disabled={isVerifyingRole || !memberAddress || !projectId}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifyingRole ? 'Verifying...' : 'Verify Role'}
        </button>
      </div>

      {/* Confirm Milestone */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Milestone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milestone ID
            </label>
            <input
              type="number"
              value={milestoneId}
              onChange={(e) => setMilestoneId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={milestoneDescription}
              onChange={(e) => setMilestoneDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Milestone description"
            />
          </div>
        </div>
        <button
          onClick={handleConfirmMilestone}
          disabled={isConfirmingMilestone || !projectId}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirmingMilestone ? 'Confirming...' : 'Confirm Milestone'}
        </button>
      </div>

      {/* Complete Project */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Project</h2>
        <button
          onClick={handleCompleteProject}
          disabled={isCompletingProject || !projectId}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompletingProject ? 'Completing...' : 'Complete Project'}
        </button>
      </div>

      {/* Withdraw Stake */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Stake</h2>
        <button
          onClick={handleWithdrawStake}
          disabled={isWithdrawingStake || !projectId}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWithdrawingStake ? 'Withdrawing...' : 'Withdraw Stake'}
        </button>
      </div>

      {/* All Projects */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Projects</h2>
        {allProjects.length > 0 ? (
          <div className="space-y-2">
            {allProjects.map((projectId, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <span className="font-mono text-sm">{projectId}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No projects found</p>
        )}
      </div>
    </div>
  );
} 