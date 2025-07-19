# Investor Payment Signatures

SquadTrust implements a robust cryptographic signature system that allows investors to cryptographically sign project and milestone payments, ensuring that payments are only processed when more than 50% of authorized investors have signed them.

## Overview

The investor signature system provides:
- **Cryptographic Verification**: Each signature is cryptographically verified using the investor's private key
- **Threshold-based Approval**: Payments require more than 50% of authorized investors to sign
- **Wallet Integration**: Seamless integration with MetaMask and other EVM wallets
- **Real-time Status**: Live updates of signature progress and approval status
- **Audit Trail**: Complete history of all signatures with timestamps
- **Payment Security**: Ensures funds are only released after proper investor approval

## Architecture

### Database Schema

The system uses two main tables for investor signature management:

#### InvestorSignature
```sql
model InvestorSignature {
  id                String    @id @default(cuid())
  project           Project   @relation(fields: [projectId], references: [id])
  projectId         String
  funding           Funding   @relation(fields: [fundingId], references: [id])
  fundingId         String
  investorAddress   String    // Wallet address of the investor
  signatures        Json      // Array of InvestorSignatureData objects
  requiredSignatures Int
  totalInvestors    Int
  status            SignatureStatus @default(PENDING)
  amount            Float
  currency          String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([fundingId])
}
```

#### MilestoneInvestorSignature
```sql
model MilestoneInvestorSignature {
  id                String    @id @default(cuid())
  milestone         Milestone @relation(fields: [milestoneId], references: [id])
  milestoneId       String
  project           Project   @relation(fields: [projectId], references: [id])
  projectId         String
  investorAddress   String    // Wallet address of the investor
  signatures        Json      // Array of InvestorSignatureData objects
  requiredSignatures Int
  totalInvestors    Int
  status            SignatureStatus @default(PENDING)
  amount            Float
  currency          String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([milestoneId])
}
```

### Signature Data Structure

Each investor signature contains:
```typescript
interface InvestorSignatureData {
  signer: string;        // Wallet address of the investor
  signature: string;     // Cryptographic signature
  message: string;       // Message that was signed
  timestamp: number;     // Unix timestamp
  nonce: string;        // Unique nonce for replay protection
  amount: number;       // Payment amount
  currency: string;     // Payment currency
}
```

## API Endpoints

### Project Funding Investor Signatures

#### GET /api/projects/:id/funding/:fundingId/investor-signatures
Get the current investor signature status for a project funding payment.

**Response:**
```json
{
  "fundingId": "funding_id",
  "projectId": "project_id",
  "totalInvestors": 4,
  "requiredSignatures": 3,
  "signatures": [...],
  "status": "PENDING",
  "percentageComplete": 75,
  "isApproved": false,
  "amount": 50000,
  "currency": "USDC",
  "missingSignatures": ["0x1234...", "0x5678..."]
}
```

#### POST /api/projects/:id/funding/:fundingId/investor-signatures
Submit a cryptographic signature for project funding payment approval.

**Request:**
```json
{
  "walletAddress": "0x1234...",
  "signature": "0xabcd...",
  "message": "SquadTrust Investor Payment Approval...",
  "amount": 50000,
  "currency": "USDC"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment approved by investors!",
  "totalSignatures": 3,
  "requiredSignatures": 3,
  "isApproved": true,
  "amount": 50000,
  "currency": "USDC"
}
```

### Milestone Investor Signatures

#### GET /api/milestones/:id/investor-signatures
Get the current investor signature status for a milestone payment.

#### POST /api/milestones/:id/investor-signatures
Submit a cryptographic signature for milestone payment approval.

## Frontend Components

### InvestorSignatureWidget

The main component for investor signature functionality:

```tsx
<InvestorSignatureWidget
  type="project"  // or "milestone"
  id={fundingId}
  title={projectTitle}
  projectId={projectId}
  amount={50000}
  currency="USDC"
  onStatusChange={(status) => console.log(status)}
/>
```

**Features:**
- Real-time signature status
- Progress bar showing completion percentage
- Wallet integration for signing
- User-friendly error handling
- Success/approval notifications
- Payment amount and currency display
- List of signed investors with timestamps
- Missing signatures tracking

## Cryptographic Implementation

### Message Format

#### Project Funding Payment Message
```
SquadTrust Investor Payment Approval

Project ID: {projectId}
Funding ID: {fundingId}
Project Title: {title}
Amount: {amount} {currency}
Nonce: {nonce}
Timestamp: {timestamp}

I approve this payment for project funding.

By signing this message, I confirm that:
1. I am an authorized investor for this project
2. I have reviewed the project deliverables and milestones
3. I approve the payment of {amount} {currency} for this project
4. This signature is valid only for this specific payment and timestamp
5. I understand this payment will be processed upon signature approval
```

#### Milestone Payment Message
```
SquadTrust Milestone Payment Approval

Project ID: {projectId}
Milestone ID: {milestoneId}
Project Title: {projectTitle}
Milestone Title: {milestoneTitle}
Amount: {amount} {currency}
Nonce: {nonce}
Timestamp: {timestamp}

I approve this payment for milestone completion.

By signing this message, I confirm that:
1. I am an authorized investor for this project
2. I have reviewed the milestone completion criteria
3. I approve the payment of {amount} {currency} for this milestone
4. This signature is valid only for this specific milestone payment and timestamp
5. I understand this payment will be processed upon signature approval
```

### Verification Process

1. **Message Creation**: System creates a unique message with payment details
2. **Wallet Signing**: Investor signs the message with their private key via MetaMask
3. **Signature Submission**: Signature is submitted to the API
4. **Cryptographic Verification**: Server verifies the signature using ethers.js
5. **Investor Authorization**: Ensures signer is an authorized investor
6. **Threshold Check**: Verifies if enough signatures are collected (>50%)
7. **Payment Processing**: Triggers payment release if approved

### Security Features

- **Nonce Protection**: Each signature includes a unique nonce to prevent replay attacks
- **Timestamp Validation**: Signatures include timestamps for temporal validation
- **Investor Authorization**: Only authorized investors can sign payments
- **Duplicate Prevention**: Each investor can only sign once per payment
- **Cryptographic Verification**: All signatures are cryptographically verified
- **Amount Validation**: Payment amounts and currencies are validated
- **Currency Support**: Supports multiple currencies (ETH, USDC, USDT, DAI, WETH)

## Usage Examples

### Signing a Project Payment

```typescript
import { useInvestorSignatures } from '@/hooks/useInvestorSignatures';

const { signWithWallet, canSign, isApproved } = useInvestorSignatures({
  type: 'project',
  id: fundingId,
  title: projectTitle,
  projectId: projectId,
  amount: 50000,
  currency: 'USDC',
});

// Investor clicks sign button
const handleSign = async () => {
  if (canSign) {
    await signWithWallet();
  }
};
```

### Signing a Milestone Payment

```typescript
const { signWithWallet, canSign, isApproved } = useInvestorSignatures({
  type: 'milestone',
  id: milestoneId,
  title: milestoneTitle,
  projectId: projectId,
  amount: 15000,
  currency: 'USDC',
});

// Check if milestone payment is approved
if (isApproved) {
  console.log('Milestone payment approved!');
}
```

## Integration with Existing Features

### Project Funding Flow

1. Project team requests funding for a specific amount
2. Investors review the project deliverables and funding request
3. Investors cryptographically sign the funding payment
4. Once >50% of investors sign, the payment is approved
5. Funds are released to the project team
6. Project status updates and credibility scores are recalculated

### Milestone Payment Flow

1. Team completes a milestone and submits for review
2. Investors review the milestone completion and KPI achievements
3. Investors cryptographically sign the milestone payment
4. Once >50% of investors sign, the payment is approved
5. Milestone payment is released to the team
6. Milestone status updates and project progress is recalculated

## Benefits

### For Investors
- **Payment Control**: Investors have direct control over when payments are released
- **Transparent Process**: Clear visibility into payment approval status
- **Cryptographic Security**: Tamper-proof payment approval system
- **Threshold-based Decisions**: Prevents single points of failure
- **Audit Trail**: Complete history of all payment approvals

### For Teams
- **Trust Building**: Cryptographic signatures build trust with investors
- **Milestone Incentives**: Clear payment structure for milestone completion
- **Quality Assurance**: Ensures work is properly reviewed before payment
- **Reputation System**: Payment history contributes to team credibility scores

### For Platform
- **Payment Security**: Ensures funds are only released after proper approval
- **Investor Confidence**: Builds investor confidence in the platform
- **Quality Control**: Ensures projects and milestones are properly reviewed
- **Automated Processing**: Reduces manual payment processing overhead

## Demo

Visit `/investor-demo` to see a live demonstration of the investor signature functionality with both project funding and milestone payment examples.

## Future Enhancements

- **Multi-Currency Support**: Support for additional cryptocurrencies
- **Smart Contract Integration**: Direct blockchain payment processing
- **Investor Management**: Dedicated investor management system
- **Payment Scheduling**: Automated payment scheduling based on milestones
- **Advanced Analytics**: Payment analytics and reporting features 