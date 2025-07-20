# SquadTrust Contract Integration

This directory contains TypeScript interfaces and React hooks for interacting with the SquadTrust smart contract.

## Overview

The SquadTrust contract is a minimal credibility system for online teams that tracks team projects and member contributions. It provides functions for:

- Creating and managing projects
- Claiming and verifying roles with stakes
- Confirming milestones
- Completing projects and updating credibility scores
- Withdrawing stakes after verification

## Files

- `index.ts` - Main contract service and utility functions
- `useSquadTrust.ts` - React hook for easy integration
- `SquadTrustExample.tsx` - Example component demonstrating usage

## Setup

### 1. Install Dependencies

```bash
npm install ethers
```

### 2. Compile the Contract

Make sure your SquadTrust contract is compiled and the ABI is available at:
```
contract/out/SquadTrust.sol/SquadTrust.json
```

### 3. Configure Contract Address

Set your deployed contract address in your environment or configuration:

```typescript
const CONTRACT_ADDRESS = "0x..."; // Your deployed contract address
```

## Usage

### Basic Setup

```typescript
import { ethers } from 'ethers';
import { useSquadTrust } from '../hooks/useSquadTrust';

function MyComponent() {
  const { signer } = useWallet(); // Your wallet connection hook
  const contractAddress = "0x..."; // Your contract address
  
  const {
    createProject,
    claimRole,
    verifyRole,
    confirmMilestone,
    completeProject,
    withdrawStake,
    getProject,
    getCredibilityScore,
    isConnected,
    error
  } = useSquadTrust({ contractAddress, signer });

  // Use the functions...
}
```

### Core Functions

#### 1. Create Project

```typescript
const handleCreateProject = async () => {
  try {
    const projectId = await createProject("My Project", 2);
    console.log("Project created:", projectId);
  } catch (error) {
    console.error("Error creating project:", error);
  }
};
```

#### 2. Claim Role

```typescript
const handleClaimRole = async () => {
  try {
    await claimRole(projectId, "Frontend Developer", "0.01");
    console.log("Role claimed successfully");
  } catch (error) {
    console.error("Error claiming role:", error);
  }
};
```

#### 3. Verify Role

```typescript
const handleVerifyRole = async () => {
  try {
    await verifyRole(projectId, memberAddress);
    console.log("Role verified successfully");
  } catch (error) {
    console.error("Error verifying role:", error);
  }
};
```

#### 4. Confirm Milestone

```typescript
const handleConfirmMilestone = async () => {
  try {
    await confirmMilestone(projectId, 1, "Completed user authentication");
    console.log("Milestone confirmed");
  } catch (error) {
    console.error("Error confirming milestone:", error);
  }
};
```

#### 5. Complete Project

```typescript
const handleCompleteProject = async () => {
  try {
    await completeProject(projectId);
    console.log("Project completed");
  } catch (error) {
    console.error("Error completing project:", error);
  }
};
```

#### 6. Withdraw Stake

```typescript
const handleWithdrawStake = async () => {
  try {
    await withdrawStake(projectId);
    console.log("Stake withdrawn successfully");
  } catch (error) {
    console.error("Error withdrawing stake:", error);
  }
};
```

### View Functions

#### Get Project Details

```typescript
const loadProject = async () => {
  try {
    const project = await getProject(projectId);
    console.log("Project:", project);
    // Returns: { name, creator, completed, createdAt, completedAt, memberCount }
  } catch (error) {
    console.error("Error loading project:", error);
  }
};
```

#### Get Member Role

```typescript
const loadMemberRole = async () => {
  try {
    const role = await getMemberRole(projectId, memberAddress);
    console.log("Member role:", role);
    // Returns: { role, verified, stakeAmount }
  } catch (error) {
    console.error("Error loading member role:", error);
  }
};
```

#### Get Credibility Score

```typescript
const loadCredibilityScore = async () => {
  try {
    const score = await getCredibilityScore(memberAddress);
    console.log("Credibility score:", score);
  } catch (error) {
    console.error("Error loading credibility score:", error);
  }
};
```

#### Get All Projects

```typescript
const loadAllProjects = async () => {
  try {
    const projects = await getAllProjects();
    console.log("All projects:", projects);
  } catch (error) {
    console.error("Error loading projects:", error);
  }
};
```

### Loading States

The hook provides loading states for each operation:

```typescript
const {
  isLoading,
  isCreatingProject,
  isClaimingRole,
  isVerifyingRole,
  isConfirmingMilestone,
  isCompletingProject,
  isWithdrawingStake
} = useSquadTrust({ contractAddress, signer });

// Use in UI
{isCreatingProject && <div>Creating project...</div>}
```

### Error Handling

```typescript
const { error, clearError } = useSquadTrust({ contractAddress, signer });

// Display error
{error && (
  <div className="error">
    {error}
    <button onClick={clearError}>Dismiss</button>
  </div>
)}
```

## Types

### Project Interface

```typescript
interface Project {
  name: string;
  creator: string;
  completed: boolean;
  createdAt: number;
  completedAt: number;
  memberCount: number;
}
```

### MemberRole Interface

```typescript
interface MemberRole {
  role: string;
  verified: boolean;
  stakeAmount: string; // Formatted ETH amount
}
```

### Milestone Interface

```typescript
interface Milestone {
  description: string;
  confirmed: boolean;
  confirmations: number;
}
```

## Utility Functions

### Address Validation

```typescript
import { isValidAddress } from '../lib/contract';

const isValid = isValidAddress("0x123...");
```

### ETH Amount Formatting

```typescript
import { formatEthAmount, parseEthAmount } from '../lib/contract';

const wei = parseEthAmount("0.01"); // "10000000000000000"
const eth = formatEthAmount("10000000000000000"); // "0.01"
```

### Error Handling

```typescript
import { handleContractError } from '../lib/contract';

try {
  await createProject("My Project", 2);
} catch (error) {
  const userMessage = handleContractError(error);
  console.log(userMessage);
}
```

## Example Component

See `SquadTrustExample.tsx` for a complete example of how to use all the functions with a modern UI.

## Contract Events

The contract emits the following events:

- `ProjectCreated` - When a new project is created
- `ProjectCompleted` - When a project is completed
- `RoleVerified` - When a member's role is verified
- `MilestoneConfirmed` - When a milestone is confirmed

You can listen to these events using ethers.js event listeners:

```typescript
const contract = new ethers.Contract(address, abi, signer);

contract.on("ProjectCreated", (projectId, creator, name, timestamp) => {
  console.log("New project created:", { projectId, creator, name, timestamp });
});
```

## Best Practices

1. **Always check wallet connection** before calling functions
2. **Handle errors gracefully** and provide user-friendly messages
3. **Use loading states** to improve UX
4. **Validate inputs** before sending transactions
5. **Refresh data** after successful transactions
6. **Use proper error boundaries** in React components

## Troubleshooting

### Common Issues

1. **"Wallet not connected"** - Ensure the signer is properly connected
2. **"Insufficient stake"** - Make sure stake amount meets minimum requirement (0.01 ETH)
3. **"Project does not exist"** - Verify the project ID is correct
4. **"Not a project member"** - Ensure the user is a member of the project
5. **"Only creator can verify"** - Only project creators can verify roles

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('debug', 'squadtrust:*');
```

This will log all contract interactions to the console. 