# Cryptographic Signature System

SquadTrust implements a robust cryptographic signature system that allows team members to cryptographically sign projects and tasks, ensuring that projects only pass when more than 50% of team members have signed them.

## Overview

The signature system provides:
- **Cryptographic Verification**: Each signature is cryptographically verified using the signer's private key
- **Threshold-based Approval**: Projects/tasks require more than 50% of team members to sign
- **Wallet Integration**: Seamless integration with MetaMask and other EVM wallets
- **Real-time Status**: Live updates of signature progress and approval status
- **Audit Trail**: Complete history of all signatures with timestamps

## Architecture

### Database Schema

The system uses two main tables for signature management:

#### ProjectSignature
```sql
model ProjectSignature {
  id                String    @id @default(cuid())
  project           Project   @relation(fields: [projectId], references: [id])
  projectId         String
  teamId            String
  signatures        Json      // Array of SignatureData objects
  requiredSignatures Int
  totalMembers      Int
  status            SignatureStatus @default(PENDING)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([projectId])
}
```

#### TaskSignature
```sql
model TaskSignature {
  id                String    @id @default(cuid())
  milestone         Milestone @relation(fields: [milestoneId], references: [id])
  milestoneId       String
  projectId         String
  teamId            String
  signatures        Json      // Array of SignatureData objects
  requiredSignatures Int
  totalMembers      Int
  status            SignatureStatus @default(PENDING)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([milestoneId])
}
```

### Signature Data Structure

Each signature contains:
```typescript
interface SignatureData {
  signer: string;        // Wallet address of the signer
  signature: string;     // Cryptographic signature
  message: string;       // Message that was signed
  timestamp: number;     // Unix timestamp
  nonce: string;        // Unique nonce for replay protection
}
```

## API Endpoints

### Project Signatures

#### GET /api/projects/:id/signatures
Get the current signature status for a project.

**Response:**
```json
{
  "projectId": "project_id",
  "teamId": "team_id",
  "totalMembers": 5,
  "requiredSignatures": 3,
  "signatures": [...],
  "status": "PENDING",
  "percentageComplete": 60,
  "isApproved": false,
  "missingSignatures": ["0x1234...", "0x5678..."]
}
```

#### POST /api/projects/:id/signatures
Submit a cryptographic signature for project approval.

**Request:**
```json
{
  "walletAddress": "0x1234...",
  "signature": "0xabcd...",
  "message": "SquadTrust Project Approval..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signature added successfully",
  "totalSignatures": 3,
  "requiredSignatures": 3,
  "isApproved": true
}
```

### Task Signatures

#### GET /api/milestones/:id/signatures
Get the current signature status for a task/milestone.

#### POST /api/milestones/:id/signatures
Submit a cryptographic signature for task completion.

## Frontend Components

### SignatureWidget

The main component for signature functionality:

```tsx
<SignatureWidget
  type="project"  // or "task"
  id={projectId}
  title={projectTitle}
  teamId={teamId}
  onStatusChange={(status) => console.log(status)}
/>
```

**Features:**
- Real-time signature status
- Progress bar showing completion percentage
- Wallet integration for signing
- User-friendly error handling
- Success/approval notifications

### SignatureDetails

Detailed view of all signatures:

```tsx
<SignatureDetails
  signatures={signatures}
  totalMembers={totalMembers}
  requiredSignatures={requiredSignatures}
  isApproved={isApproved}
/>
```

**Features:**
- List of all signers with timestamps
- Signature hash verification
- Cryptographic verification info
- Expandable/collapsible details

## Cryptographic Implementation

### Message Format

#### Project Approval Message
```
SquadTrust Project Approval

Project ID: {projectId}
Team ID: {teamId}
Project Title: {title}
Nonce: {nonce}
Timestamp: {timestamp}

I approve this project for completion and delivery.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the project deliverables
3. I approve the project for completion
4. This signature is valid only for this specific project and timestamp
```

#### Task Completion Message
```
SquadTrust Task Completion

Task ID: {taskId}
Project ID: {projectId}
Team ID: {teamId}
Task Title: {title}
Nonce: {nonce}
Timestamp: {timestamp}

I confirm this task has been completed satisfactorily.

By signing this message, I confirm that:
1. I am a member of the team
2. I have reviewed the task completion
3. I approve the task as completed
4. This signature is valid only for this specific task and timestamp
```

### Verification Process

1. **Message Creation**: System creates a unique message with project/task details
2. **Wallet Signing**: User signs the message with their private key via MetaMask
3. **Signature Submission**: Signature is submitted to the API
4. **Cryptographic Verification**: Server verifies the signature using ethers.js
5. **Team Member Validation**: Ensures signer is a team member
6. **Threshold Check**: Verifies if enough signatures are collected (>50%)
7. **Status Update**: Updates project/task status if approved

### Security Features

- **Nonce Protection**: Each signature includes a unique nonce to prevent replay attacks
- **Timestamp Validation**: Signatures include timestamps for temporal validation
- **Team Membership Check**: Only team members can sign projects/tasks
- **Duplicate Prevention**: Each team member can only sign once per project/task
- **Cryptographic Verification**: All signatures are cryptographically verified

## Usage Examples

### Signing a Project

```typescript
import { useSignatures } from '@/hooks/useSignatures';

const { signWithWallet, canSign, isApproved } = useSignatures({
  type: 'project',
  id: projectId,
  title: projectTitle,
  teamId: teamId,
});

// User clicks sign button
const handleSign = async () => {
  if (canSign) {
    await signWithWallet();
  }
};
```

### Checking Signature Status

```typescript
const { signatureStatus, loading } = useSignatures({
  type: 'project',
  id: projectId,
  title: projectTitle,
  teamId: teamId,
});

if (signatureStatus?.isApproved) {
  console.log('Project approved by team!');
}
```

## Integration with Existing Features

### Project Completion Flow

1. Team works on project milestones
2. Individual tasks are completed and signed by team members
3. When all tasks are complete, project requires team approval
4. Team members cryptographically sign the project
5. Once >50% of team members sign, project is marked as completed
6. Project status updates and credibility scores are recalculated

### Task Completion Flow

1. Individual team member completes a task
2. Other team members review the task completion
3. Team members cryptographically sign the task
4. Once >50% of team members sign, task is marked as completed
5. Task status updates and project progress is recalculated

## Benefits

### For Teams
- **Transparent Approval**: Clear visibility into who has approved what
- **Cryptographic Security**: Tamper-proof approval system
- **Threshold-based Decisions**: Prevents single points of failure
- **Audit Trail**: Complete history of all approvals

### For Platform
- **Trust Building**: Cryptographic signatures build trust in the platform
- **Quality Assurance**: Ensures projects are properly reviewed before completion
- **Reputation System**: Signature history contributes to team credibility scores
- **Dispute Resolution**: Cryptographic proof for any disputes

## Future Enhancements

- **Multi-signature Wallets**: Support for Gnosis Safe and other multi-sig wallets
- **Time-locked Signatures**: Signatures that become valid after a certain time
- **Delegated Signing**: Allow team members to delegate signing authority
- **Signature Templates**: Customizable signature messages for different project types
- **Blockchain Integration**: Store signature hashes on-chain for additional security 