# SquadTrust - Technical Documentation

> A blockchain-based team reputation and project management platform with advanced credibility verification and anti-gaming mechanisms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Smart Contracts](#smart-contracts)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Reputation Algorithm](#reputation-algorithm)
- [Blockchain Integration](#blockchain-integration)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

SquadTrust is a comprehensive blockchain-based platform that enables teams to build and verify reputation through transparent contribution tracking, smart contract verification, and advanced anti-gaming mechanisms. The platform combines traditional project management with blockchain technology to create immutable, verifiable records of team performance and credibility.

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

### System Components

1. **Frontend Layer**: Next.js 15 with React 19, Tailwind CSS, and Radix UI
2. **Backend Layer**: Next.js API routes with Prisma ORM and PostgreSQL
3. **Blockchain Layer**: Solidity smart contracts with Foundry deployment
4. **Authentication**: NextAuth.js with wallet-based authentication
5. **State Management**: TanStack Query for server state, React hooks for client state

## ✨ Features

### Core Features

#### 🏢 Team Management
- **Team Creation & Management**: Create teams with transparent reputation scores
- **Role-Based Access Control**: Admin/Member roles with different permissions
- **Automatic Cleanup**: Teams with 0 members or 0 admin members are automatically deleted
- **Join/Leave Workflows**: Seamless team membership management

#### 📋 Project Management
- **Blockchain-Integrated Projects**: Projects created on-chain using SquadTrust smart contract
- **Milestone Tracking**: Comprehensive milestone management with verification
- **Funding Management**: Investor signatures and funding workflows
- **Project Completion**: End-to-end project lifecycle management

#### 🏆 Reputation System
- **Multi-Factor Scoring**: Base (40) + Time (30) + Budget (30) = 100 max points
- **Time Decay Algorithm**: Exponential decay over 30-day periods
- **Budget Tracking**: Actual vs. planned cost comparison
- **Abandonment Penalties**: -20 points per abandoned project
- **Dynamic Calculation**: `score = (base + time + budget) / decay_factor - penalties`

#### 🔐 Security & Verification
- **EIP-712 Cryptographic Verification**: Multi-signature role verification
- **Anti-Gaming System**: Dispute creation and community voting
- **Stake Slashing**: Up to 10% stake slashing for false claims
- **Execution NFTs**: Automatic minting on successful project completion

### Advanced Features

#### 🎨 Execution NFTs
- **Automatic Minting**: NFTs minted on successful project completion
- **Rich Metadata**: Project details, team composition, reputation impact
- **On-Chain SVG**: Generated artwork with project-specific details
- **Cross-Platform Proof**: Portable reputation verification

#### ⚖️ Dispute System
- **Dispute Creation**: High-reputation users can create disputes
- **Community Voting**: Reputation-weighted voting system
- **Disputer Rewards**: 20% of slashed stake to successful disputers
- **Sybil Resistance**: Reputation thresholds for participation

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **Language**: TypeScript 5.0
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI (comprehensive component library)
- **State Management**: TanStack Query 5.83.0
- **Forms**: React Hook Form 7.54.1
- **Validation**: Zod 3.24.1

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL with Prisma ORM 6.12.0
- **Authentication**: NextAuth.js 4.24.11
- **API**: Next.js API routes
- **Validation**: Zod 3.24.1

### Blockchain
- **Language**: Solidity 0.8.19
- **Development**: Foundry
- **Testing**: Forge
- **Deployment**: Foundry scripts
- **Web3 Integration**: Ethers.js 6.15.0, Viem 2.32.0, Wagmi 2.15.7

### Development Tools
- **Package Manager**: pnpm 9.10.0
- **Linting**: ESLint 9
- **Type Checking**: TypeScript 5.0
- **Environment**: Bun (recommended) or npm

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Bun (recommended) or npm
- Local blockchain (Anvil/Foundry) for development

### Environment Setup

Create a `.env` file with the following variables:

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

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd squadtrust
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npx prisma db push
   ```

5. **Deploy smart contracts**
   ```bash
   cd contract
   forge build
   forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
   ```

6. **Start development server**
   ```bash
   bun run dev
   ```

## 📜 Smart Contracts

### SquadTrust.sol

The main smart contract that handles project and team management.

#### Key Features:
- **Project Management**: Create, fund, and complete projects
- **Team Management**: Create teams and manage members
- **Staking System**: Stake-based role claiming and verification
- **Milestone Tracking**: Create and complete milestones
- **Dispute System**: Handle disputes with community voting

#### Core Structs:
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

struct Milestone {
    string title;
    uint256 deadline;
    uint256 compensation;
    bool completed;
    bool rewarded;
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

Handles the minting of execution NFTs for completed projects.

#### Features:
- **Automatic Minting**: NFTs minted on successful project completion
- **Rich Metadata**: Project details and team composition
- **On-Chain SVG**: Generated artwork with project-specific details

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
  joinRequests            JoinRequest[]
  milestoneConfirmations  MilestoneConfirmation[]
  milestoneVerifications  MilestoneVerification[]
  notifications           Notification[]
  oracleVerifications     OracleVerification[]
  projectAbandonmentVotes ProjectAbandonmentVote[]
  teams                   TeamMember[]
  scoreData               UserScoreData?
  verifications           Verification[]
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
  joinRequests   JoinRequest[]
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
  deliveryHash                String?
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
  investorSignatures          InvestorSignature[]
  milestones                  Milestone[]
  milestoneInvestorSignatures MilestoneInvestorSignature[]
  team                        Team?                        @relation(fields: [teamId], references: [id])
  abandonmentVotes            ProjectAbandonmentVote[]
  scoreData                   ProjectScoreData?
  signatures                  ProjectSignature?
}
```

### Enums
```prisma
enum TeamMemberRole {
  ADMIN
  MEMBER
}

enum ProjectStatus {
  HIRING
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

enum ProjectType {
  HACKATHON
  STARTUP
  ENTERPRISE
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
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

**Response:**
```json
{
  "teams": [
    {
      "id": "string",
      "name": "string",
      "bio": "string",
      "website": "string",
      "createdAt": "datetime",
      "tags": ["string"],
      "onchainTeamId": "string",
      "credibility": {
        "score": "number",
        "lastUpdated": "datetime"
      },
      "members": [
        {
          "id": "string",
          "role": "ADMIN|MEMBER",
          "joinedAt": "datetime",
          "user": {
            "id": "string",
            "name": "string",
            "walletAddress": "string"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

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

#### `POST /api/teams/cleanup`
Clean up empty teams.

### Projects API

#### `GET /api/projects/[id]`
Get project details by ID.

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

#### `POST /api/projects/[id]/apply/[applicationId]/accept`
Accept an application (project creator only).

#### `POST /api/projects/[id]/apply/[applicationId]/reject`
Reject an application (project creator only).

### Milestones API

#### `POST /api/projects/[id]/milestones`
Create a milestone.

#### `POST /api/milestones/[id]/complete`
Mark milestone as completed.

#### `POST /api/milestones/[id]/verify`
Verify milestone completion.

### Disputes API

#### `POST /api/disputes`
Create a dispute.

#### `POST /api/disputes/[id]/resolve`
Resolve a dispute.

#### `POST /api/disputes/auto-resolve`
Auto-resolve disputes based on reputation.

## 🎨 Frontend Components

### Core Components

#### Header Component
```typescript
// components/header.tsx
export function Header() {
  // Navigation, wallet connection, user menu
}
```

#### Features Section
```typescript
// components/features-section.tsx
export function FeaturesSection() {
  // Platform features display with icons and descriptions
}
```

### UI Components (Radix UI)

The application uses a comprehensive set of Radix UI components:

- **Navigation**: NavigationMenu, Menubar
- **Forms**: Form, Input, Select, Checkbox, RadioGroup
- **Feedback**: Toast, AlertDialog, Dialog
- **Layout**: Accordion, Collapsible, Tabs
- **Data Display**: Avatar, Progress, Separator
- **Interactive**: Button, Switch, Slider, Toggle

### Custom Hooks

#### `useWalletConnection`
```typescript
// hooks/useWalletConnection.ts
export function useWalletConnection() {
  // Wallet connection logic with wagmi
}
```

#### `useReputation`
```typescript
// hooks/useReputation.ts
export function useReputation(userId: string) {
  // Reputation score calculation and updates
}
```

## 🏆 Reputation Algorithm

### Multi-Factor Scoring System

The reputation algorithm uses a sophisticated multi-factor approach:

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

The platform uses EIP-712 for secure signature verification:

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

### Production Deployment

#### Environment Setup
```bash
# Production environment variables
DATABASE_URL="postgresql://prod-user:password@prod-host:5432/squadtrust"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"
SQUADTRUST_CONTRACT_ADDRESS="0x..."
RPC_URL="https://mainnet-rpc-url"
PRIVATE_KEY="production-private-key"
```

#### Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

#### Smart Contract Deployment
```bash
cd contract
forge script script/Deploy.s.sol --rpc-url $MAINNET_RPC --broadcast --verify
```

#### Application Deployment
```bash
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

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/squadtrust
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=squadtrust
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔄 Development Workflow

### Code Quality

#### Linting
```bash
npm run lint
```

#### Type Checking
```bash
npm run type-check
```

#### Testing
```bash
# Contract tests
cd contract && forge test

# Application tests
npm run test
```

### Git Workflow

1. **Feature Branches**: Create feature branches from main
2. **Pull Requests**: Submit PRs for review
3. **Code Review**: Mandatory review process
4. **Testing**: All changes must pass tests
5. **Deployment**: Automated deployment on merge

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

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Performance Monitoring

- **Database**: Monitor query performance with Prisma Studio
- **Blockchain**: Track gas usage and transaction times
- **Frontend**: Use React DevTools for component profiling

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes**: Follow coding standards
4. **Add tests**: Ensure all tests pass
5. **Submit PR**: Create pull request with description

### Coding Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Conventional Commits**: Follow conventional commit format

### Testing Guidelines

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **Contract Tests**: Test smart contract functionality
- **E2E Tests**: Test complete user workflows

### Documentation

- **Code Comments**: Document complex logic
- **API Documentation**: Keep API docs updated
- **README Updates**: Update README for new features
- **Architecture Docs**: Document architectural decisions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Radix UI**: For the accessible component library
- **Prisma Team**: For the excellent ORM
- **Foundry Team**: For the Solidity development tools
- **OpenZeppelin**: For the secure smart contract libraries

---

*Last updated: January 2025* 