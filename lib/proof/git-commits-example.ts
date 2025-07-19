import { 
  getUserCommitHistory, 
  getAllCommitsByUser, 
  getUserCommitStats, 
  validateGitHubToken,
  type GitHubCommit 
} from './git-commits';

/**
 * Example usage of GitHub commit tracking functions
 * 
 * To use this:
 * 1. Create a GitHub personal access token with 'repo' scope
 * 2. Replace 'YOUR_GITHUB_TOKEN' with your actual token
 * 3. Update the repoUrl and userAccount variables
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN';
const REPO_URL = 'https://github.com/owner/repo'; // Replace with actual repo URL
const USER_ACCOUNT = 'username'; // Replace with actual GitHub username

/**
 * Example: Get commit history for a specific user
 */
export async function exampleGetUserCommits() {
  try {
    // Validate token first
    const isValid = await validateGitHubToken(GITHUB_TOKEN);
    if (!isValid) {
      console.error('Invalid GitHub token');
      return;
    }

    const commits = await getUserCommitHistory(
      GITHUB_TOKEN,
      REPO_URL,
      USER_ACCOUNT,
      { per_page: 50 }
    );

    console.log(`Found ${commits.length} commits by ${USER_ACCOUNT}:`);
    commits.forEach((commit, index) => {
      console.log(`${index + 1}. ${commit.commit.message} (${commit.sha.substring(0, 7)})`);
    });

    return commits;
  } catch (error) {
    console.error('Error getting user commits:', error);
  }
}

/**
 * Example: Get all commits and filter by user
 */
export async function exampleGetAllCommitsByUser() {
  try {
    const commits = await getAllCommitsByUser(
      GITHUB_TOKEN,
      REPO_URL,
      USER_ACCOUNT
    );

    console.log(`Found ${commits.length} commits by ${USER_ACCOUNT} in all commits:`);
    commits.forEach((commit, index) => {
      const date = new Date(commit.commit.author.date).toLocaleDateString();
      console.log(`${index + 1}. [${date}] ${commit.commit.message}`);
    });

    return commits;
  } catch (error) {
    console.error('Error getting all commits by user:', error);
  }
}

/**
 * Example: Get commit statistics for a user
 */
export async function exampleGetUserCommitStats() {
  try {
    const stats = await getUserCommitStats(
      GITHUB_TOKEN,
      REPO_URL,
      USER_ACCOUNT
    );

    console.log(`Commit Statistics for ${USER_ACCOUNT}:`);
    console.log(`Total commits: ${stats.totalCommits}`);
    
    if (stats.firstCommit) {
      console.log(`First commit: ${stats.firstCommit.commit.message} (${new Date(stats.firstCommit.commit.author.date).toLocaleDateString()})`);
    }
    
    if (stats.lastCommit) {
      console.log(`Last commit: ${stats.lastCommit.commit.message} (${new Date(stats.lastCommit.commit.author.date).toLocaleDateString()})`);
    }

    return stats;
  } catch (error) {
    console.error('Error getting user commit stats:', error);
  }
}

/**
 * Example: Process commits with more detailed information
 */
export async function exampleProcessCommits() {
  try {
    const commits = await getUserCommitHistory(GITHUB_TOKEN, REPO_URL, USER_ACCOUNT);
    
    const processedCommits = commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author?.login || commit.commit.author.name,
      date: new Date(commit.commit.author.date),
      url: commit.html_url,
      additions: 0, // Would need additional API calls to get file changes
      deletions: 0,
    }));

    console.log('Processed commits:', processedCommits);
    return processedCommits;
  } catch (error) {
    console.error('Error processing commits:', error);
  }
}

/**
 * Example: Get commits within a date range
 */
export async function exampleGetCommitsInDateRange() {
  try {
    const since = '2024-01-01T00:00:00Z';
    const until = '2024-12-31T23:59:59Z';

    const commits = await getUserCommitHistory(
      GITHUB_TOKEN,
      REPO_URL,
      USER_ACCOUNT,
      {
        since,
        until,
        per_page: 100
      }
    );

    console.log(`Found ${commits.length} commits by ${USER_ACCOUNT} in 2024:`);
    commits.forEach(commit => {
      const date = new Date(commit.commit.author.date).toLocaleDateString();
      console.log(`- [${date}] ${commit.commit.message}`);
    });

    return commits;
  } catch (error) {
    console.error('Error getting commits in date range:', error);
  }
}

// Export all examples for easy testing
export const examples = {
  getUserCommits: exampleGetUserCommits,
  getAllCommitsByUser: exampleGetAllCommitsByUser,
  getUserCommitStats: exampleGetUserCommitStats,
  processCommits: exampleProcessCommits,
  getCommitsInDateRange: exampleGetCommitsInDateRange,
}; 