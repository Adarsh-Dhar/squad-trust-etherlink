# GitHub Commit Tracking

This module provides functions to track and analyze GitHub commits using the GitHub REST API via Octokit.js.

## Setup

### 1. Install Dependencies

The module uses `octokit` for GitHub API interactions. It should already be installed in your project.

### 2. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with the following scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories only)
3. Copy the token and store it securely

### 3. Environment Variables

Add your GitHub token to your environment variables:

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token_here
```

## Usage

### Basic Usage

```typescript
import { getUserCommitHistory, validateGitHubToken } from '@/lib/proof/git-commits';

// Validate your token first
const isValid = await validateGitHubToken(process.env.GITHUB_TOKEN!);
if (!isValid) {
  console.error('Invalid GitHub token');
  return;
}

// Get commit history for a specific user
const commits = await getUserCommitHistory(
  process.env.GITHUB_TOKEN!,
  'https://github.com/owner/repo',
  'username',
  { per_page: 50 }
);

console.log(`Found ${commits.length} commits`);
```

### Available Functions

#### `getUserCommitHistory(token, repoUrl, userAccount, options?)`

Fetches commit history for a specific user in a GitHub repository.

**Parameters:**
- `token`: GitHub personal access token
- `repoUrl`: GitHub repository URL (e.g., "https://github.com/owner/repo")
- `userAccount`: GitHub username to filter commits by
- `options`: Optional parameters for filtering commits

**Returns:** Promise<GitHubCommit[]>

#### `getAllCommitsByUser(token, repoUrl, userAccount, options?)`

Fetches all commits in a repository and filters by user.

**Parameters:** Same as `getUserCommitHistory`

**Returns:** Promise<GitHubCommit[]>

#### `getUserCommitStats(token, repoUrl, userAccount)`

Gets commit statistics for a user in a repository.

**Returns:**
```typescript
{
  totalCommits: number;
  firstCommit: GitHubCommit | null;
  lastCommit: GitHubCommit | null;
  commitDates: string[];
}
```

#### `validateGitHubToken(token)`

Validates if a GitHub token has the necessary permissions.

**Returns:** Promise<boolean>

### Advanced Usage

#### Date Range Filtering

```typescript
const commits = await getUserCommitHistory(
  token,
  repoUrl,
  userAccount,
  {
    since: '2024-01-01T00:00:00Z',
    until: '2024-12-31T23:59:59Z',
    per_page: 100
  }
);
```

#### Get Commit Statistics

```typescript
const stats = await getUserCommitStats(token, repoUrl, userAccount);

console.log(`Total commits: ${stats.totalCommits}`);
console.log(`First commit: ${stats.firstCommit?.commit.message}`);
console.log(`Last commit: ${stats.lastCommit?.commit.message}`);
```

#### Process Commits with Custom Logic

```typescript
const commits = await getUserCommitHistory(token, repoUrl, userAccount);

const processedCommits = commits.map(commit => ({
  sha: commit.sha,
  message: commit.commit.message,
  author: commit.author?.login || commit.commit.author.name,
  date: new Date(commit.commit.author.date),
  url: commit.html_url,
}));
```

## Types

### GitHubCommit

```typescript
interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{ sha: string; url: string; html_url: string }>;
  html_url: string;
  url: string;
}
```

### CommitHistoryOptions

```typescript
interface CommitHistoryOptions {
  per_page?: number;
  since?: string;
  until?: string;
  author?: string;
}
```

## Error Handling

All functions include proper error handling and will throw descriptive errors for common issues:

- Invalid repository URL format
- Invalid GitHub token
- API rate limiting
- Repository access permissions

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit your GitHub token to version control**
2. **Use environment variables to store tokens**
3. **Rotate tokens regularly**
4. **Use the minimum required scopes for your use case**
5. **Consider using GitHub Apps for production applications**

## Rate Limiting

The GitHub API has rate limits:
- Authenticated requests: 5,000 requests per hour
- Unauthenticated requests: 60 requests per hour

The functions handle rate limiting gracefully and will throw appropriate errors when limits are exceeded.

## Examples

See `git-commits-example.ts` for complete usage examples including:
- Basic commit history retrieval
- Date range filtering
- Commit statistics
- Error handling patterns 