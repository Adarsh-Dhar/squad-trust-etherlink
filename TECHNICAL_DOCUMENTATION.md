# SquadTrust - Technical Documentation

> A blockchain-based team reputation and project management platform with advanced credibility verification and anti-gaming mechanisms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Smart Contracts](#smart-contracts)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Reputation Algorithm](#reputation-algorithm)
- [Blockchain Integration](#blockchain-integration)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

SquadTrust is a comprehensive blockchain-based platform that enables teams to build and verify reputation through transparent contribution tracking, smart contract verification, and advanced anti-gaming mechanisms.

### Mission Statement
To create the most trusted environment for team collaboration by leveraging blockchain technology for transparent reputation tracking and verification.

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (Solidity)    │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Prisma ORM    │    │ • SquadTrust    │
│ • Tailwind CSS  │    │ • PostgreSQL    │    │ • ExecutionNFT  │
│ • Wagmi/Viem    │    │ • NextAuth      │    │ • EIP-712       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### Core Features

#### 🏢 Team Management
- Create and manage teams with transparent reputation scores
- Role-based access control (Admin/Member roles)
- Automatic cleanup of empty teams
- Join/leave workflows

#### 📋 Project Management
- Blockchain-integrated project creation
- Milestone tracking and verification
- Funding management with investor signatures
- End-to-end project lifecycle management

#### 🏆 Reputation System
- Multi-factor scoring (Base 40 + Time 30 + Budget 30)
- Time decay algorithm over 30-day periods
- Budget tracking and abandonment penalties
- Dynamic calculation with decay factors

#### 🔐 Security & Verification
- EIP-712 cryptographic verification
- Anti-gaming dispute system
- Stake slashing mechanisms
- Execution NFTs for completed projects

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **Language**: TypeScript 5.0
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI
- **State Management**: TanStack Query 5.83.0
- **Forms**: React Hook Form 7.54.1
- **Validation**: Zod 3.24.1

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL with Prisma ORM 6.12.0
- **Authentication**: NextAuth.js 4.24.11
- **API**: Next.js API routes

### Blockchain
- **Language**: Solidity 0.8.19
- **Development**: Foundry
- **Testing**: Forge
- **Web3 Integration**: Ethers.js 6.15.0, Viem 2.32.0, Wagmi 2.15.7

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Bun (recommended) or npm
- Local blockchain (Anvil/Foundry) for development

### Environment Setup

Create a `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5431/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Blockchain Configuration
SQUADTRUST_CONTRACT_ADDRESS="0x0b306bf915c4d645ff596e518faf3f9669b97016"
RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="your-private-key-for-server-side-transactions"
```

### Installation Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd squadtrust
   bun install
   ```

2. **Set up database**
   ```bash
   npx prisma db push
   ```

3. **Deploy smart contracts**
   ```bash
   cd contract
   forge build
   forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
   ```

4. **Start development server**
   ```bash
   bun run dev
   ```

## 📜 Smart Contracts

### SquadTrust.sol

Main smart contract handling project and team management.

#### Key Structs:
```solidity
struct Project {
    address creator;
    string name;
    uint256 totalReward;
    uint256 minTeamStake;
    bool funded;
    bool completed;
    bool teamHired;
    uint256 createdAt;
}

struct Team {
    address leader;
    string name;
    address[] members;
    uint256 stakedAmount;
    bool hired;
    bool exists;
}
```

#### Key Functions:
- `createProject()`: Create a new project on-chain
- `createTeam()`: Create a new team
- `applyForProject()`: Apply for a project with stake
- `hireTeam()`: Hire a team for a project
- `completeMilestone()`: Mark milestone as completed
- `createDispute()`: Create a dispute for false claims

### ExecutionNFT.sol

Handles minting of execution NFTs for completed projects.

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id                      String                   @id @default(cuid())
  walletAddress           String                   @unique
  name                    String?
  bio                     String?
  github                  String?
  linkedin                String?
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime                 @updatedAt
  applications            Application[]
  roles                   ContributorRole[]
  credibility             CredibilityScore?
  teams                   TeamMember[]
  scoreData               UserScoreData?
}
```

#### Team
```prisma
model Team {
  id             String            @id @default(cuid())
  name           String
  bio            String?
  website        String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  tags           String[]
  onchainTeamId  String?           @unique
  credibility    CredibilityScore?
  projects       Project[]
  members        TeamMember[]
  applications   Application[]
}
```

#### Project
```prisma
model Project {
  id                          String                       @id @default(cuid())
  teamId                      String?
  description                 String
  githubRepo                  String?
  liveUrl                     String?
  status                      ProjectStatus                @default(HIRING)
  createdAt                   DateTime                     @default(now())
  updatedAt                   DateTime                     @updatedAt
  blockchainProjectId         String?
  contractAddress             String?
  contractProjectId           String?
  actualCost                  Float?
  completedAt                 DateTime?
  estimatedCost               Float?
  estimatedDuration           Int?
  projectType                 ProjectType?                 @default(STARTUP)
  creator                     String
  fundingAmount               Float?
  minimumStake                Float?
  name                        String?
  skillsRequired              String?
  applications                Application[]
  roles                       ContributorRole[]
  funding                     Funding[]
  milestones                  Milestone[]
  team                        Team?                        @relation(fields: [teamId], references: [id])
  scoreData                   ProjectScoreData?
  signatures                  ProjectSignature?
}
```

## 🔌 API Reference

### Teams API

#### `GET /api/teams`
List all teams with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for team name
- `tags`: Filter by tags

#### `POST /api/teams`
Create a new team.

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "website": "string",
  "tags": ["string"]
}
```

#### `GET /api/teams/[teamId]`
Get team details by ID.

#### `DELETE /api/teams/[teamId]`
Delete a team (admin only).

### Projects API

#### `POST /api/teams/[teamId]/projects`
Create a new project with blockchain integration.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "githubRepo": "string",
  "liveUrl": "string",
  "estimatedCost": "number",
  "estimatedDuration": "number",
  "projectType": "HACKATHON|STARTUP|ENTERPRISE",
  "fundingAmount": "number",
  "minimumStake": "number",
  "skillsRequired": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "blockchainProjectId": "string",
  "status": "HIRING",
  "createdAt": "datetime"
}
```

### Applications API

#### `POST /api/projects/[id]/apply`
Apply for a project.

**Request Body:**
```json
{
  "teamId": "string",
  "stakeAmount": "number",
  "proposal": "string"
}
```

### Milestones API

#### `POST /api/projects/[id]/milestones`
Create a milestone.

#### `POST /api/milestones/[id]/complete`
Mark milestone as completed.

### Disputes API

#### `POST /api/disputes`
Create a dispute.

#### `POST /api/disputes/[id]/resolve`
Resolve a dispute.

## 🏆 Reputation Algorithm

### Multi-Factor Scoring System

#### Base Score (40 points)
- Project completion rate
- Team collaboration effectiveness
- Role verification accuracy

#### Time Score (30 points)
- Project delivery within estimated timeframes
- Milestone completion punctuality
- Historical performance consistency

#### Budget Score (30 points)
- Cost efficiency (actual vs. estimated)
- Resource utilization
- Financial transparency

#### Decay Factor
```typescript
const decayFactor = Math.pow(0.95, daysSinceLastActivity / 30);
```

#### Final Score Calculation
```typescript
const finalScore = (baseScore + timeScore + budgetScore) / decayFactor - penalties;
```

### Penalty System
- **Abandonment Penalty**: -20 points per abandoned project
- **Dispute Penalty**: -10 points per successful dispute
- **Verification Failure**: -5 points per failed verification

## ⛓️ Blockchain Integration

### Project Creation Flow

1. **Wallet Connection**: Users must connect their wallet
2. **Blockchain Creation**: Project created on SquadTrust smart contract
3. **Transaction Confirmation**: Wait for blockchain confirmation
4. **Database Update**: Store project in database with blockchain reference
5. **Blockchain ID Storage**: Store blockchain project ID for future reference

### Smart Contract Integration

#### Project Creation
```solidity
function createProject(
    string memory name,
    uint256 totalReward,
    uint256 minTeamStake
) external returns (bytes32 projectId)
```

#### Role Claiming
```solidity
function claimRole(
    bytes32 projectId,
    bytes32 roleId,
    uint256 stake
) external
```

#### Milestone Completion
```solidity
function completeMilestone(
    bytes32 projectId,
    uint256 milestoneId
) external
```

### EIP-712 Signature Verification

```typescript
const domain = {
  name: 'SquadTrust',
  version: '1',
  chainId: chainId,
  verifyingContract: contractAddress
};

const types = {
  RoleVerification: [
    { name: 'projectId', type: 'bytes32' },
    { name: 'roleId', type: 'bytes32' },
    { name: 'verifier', type: 'address' },
    { name: 'nonce', type: 'uint256' }
  ]
};
```

## 🔒 Security Features

### Anti-Gaming Mechanisms

1. **Dispute System**: High-reputation users can dispute false claims
2. **Stake Slashing**: Up to 10% stake slashing for false claims
3. **Reputation Thresholds**: Minimum reputation required for certain actions
4. **Sybil Resistance**: Multiple verification layers

### Cryptographic Security

1. **EIP-712 Signatures**: Secure role verification
2. **Nonce Protection**: Replay attack prevention
3. **Domain Separation**: Proper signature domain isolation
4. **Multi-Signature Support**: Multiple signer verification

### Data Integrity

1. **Blockchain Verification**: Immutable project records
2. **Database Constraints**: Foreign key relationships
3. **Transaction Atomicity**: All-or-nothing operations
4. **Audit Trails**: Comprehensive logging

## 🚀 Deployment

### Production Environment

#### Environment Variables
```bash
DATABASE_URL="postgresql://prod-user:password@prod-host:5432/squadtrust"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
SQUADTRUST_CONTRACT_ADDRESS="0x..."
RPC_URL="https://mainnet-rpc-url"
PRIVATE_KEY="production-private-key"
```

#### Deployment Steps
```bash
# Database migration
npx prisma migrate deploy
npx prisma generate

# Smart contract deployment
cd contract
forge script script/Deploy.s.sol --rpc-url $MAINNET_RPC --broadcast --verify

# Application deployment
npm run build
npm start
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔄 Development Workflow

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Contract tests
cd contract && forge test
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Smart Contract Issues
```bash
# Rebuild contracts
cd contract && forge build

# Run tests
forge test
```

#### Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Debug Mode

```bash
DEBUG=* npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Last updated: January 2025* 