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
- Milestone tracking and verification
- Funding management with investor signatures
- Project completion workflows

### Reputation System
- Trust score calculation based on team performance
- Credibility verification through blockchain proofs
- Transparent reputation tracking

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

### Setup
1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables
4. Run database migrations: `bun run db:push`
5. Start the development server: `bun run dev`

### Environment Variables
Create a `.env` file with the following variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: NextAuth secret
- `NEXTAUTH_URL`: Your application URL

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
- `POST /api/projects` - Create a new project
- `DELETE /api/projects/[id]` - Delete a project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
