# SquadTrust

A blockchain-based team reputation and project management platform.

## Features

### Team Management
- Create and manage teams with transparent reputation scores
- Join/leave teams with automatic cleanup
- **Automatic team deletion**: Teams with 0 members or 0 admin members are automatically deleted to maintain data integrity
- Role-based access control (Admin/Member roles)

### Project Management
- Create and manage projects within teams
- **Blockchain Integration**: Projects are created on-chain using the SquadTrust smart contract
- Milestone tracking and verification
- Funding management with investor signatures
- Project completion workflows

### Reputation System
- Trust score calculation based on team performance
- Credibility verification through blockchain proofs
- Transparent reputation tracking

## Blockchain Integration

### Project Creation Flow

1. **Wallet Connection**: Users must connect their wallet to create projects
2. **Blockchain Creation**: Projects are first created on the SquadTrust smart contract
3. **Transaction Confirmation**: The system waits for blockchain transaction confirmation
4. **Database Update**: Only after successful blockchain creation, the project is stored in the database
5. **Blockchain ID Storage**: The blockchain project ID is stored in the database for future reference

### Environment Variables

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

### Smart Contract Integration

The platform integrates with the SquadTrust smart contract for:

- **Project Creation**: Projects are created on-chain with required confirmations
- **Role Claiming**: Team members can claim roles with stakes
- **Role Verification**: Project creators can verify member roles
- **Milestone Confirmation**: Milestones can be confirmed on-chain
- **Project Completion**: Projects can be marked as completed on-chain

### API Endpoints

The project creation API (`POST /api/teams/[teamId]/projects`) now:

1. Validates wallet address and team membership
2. Creates project on the blockchain
3. Waits for transaction confirmation
4. Stores project in database with blockchain reference
5. Returns both database and blockchain project IDs

## Team Deletion Logic

The platform automatically deletes teams in the following scenarios:

1. **Zero Members**: When the last member leaves a team, the team is automatically deleted
2. **Zero Admin Members**: When the last admin member leaves a team, the team is automatically deleted

This ensures that:
- No orphaned teams exist in the system
- Data integrity is maintained
- Resources are properly cleaned up

### Manual Cleanup

You can manually trigger a cleanup of empty teams using the API endpoint:

```bash
curl -X POST http://localhost:3000/api/teams/cleanup
```

Or run the cleanup script:

```bash
node scripts/cleanup-empty-teams.js
```

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL
- Bun (recommended) or npm
- Local blockchain (Anvil/Foundry) for development

### Setup
1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables (see above)
4. Run database migrations: `npx prisma db push`
5. Deploy the SquadTrust contract locally
6. Start the development server: `bun run dev`

### Contract Deployment

1. Navigate to the contract directory: `cd contract`
2. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
3. Build the contract: `forge build`
4. Deploy locally: `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast`

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[teamId]` - Get team details
- `DELETE /api/teams/[teamId]` - Delete a team
- `POST /api/teams/cleanup` - Clean up empty teams

### Team Members
- `GET /api/teams/[teamId]/members` - List team members
- `POST /api/teams/[teamId]/members` - Add member to team
- `DELETE /api/teams/[teamId]/members/[userId]` - Remove member from team

### Projects
- `GET /api/projects/[id]` - Get project details
- `POST /api/teams/[teamId]/projects` - Create a new project (with blockchain integration)
- `DELETE /api/projects/[id]` - Delete a project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
