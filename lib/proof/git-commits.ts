import { Octokit } from "octokit";

export interface GitHubCommit {
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

export interface CommitHistoryOptions {
  per_page?: number;
  since?: string;
  until?: string;
  author?: string;
}

/**
 * Creates an Octokit instance with the provided GitHub token
 * @param token - GitHub personal access token
 * @returns Octokit instance
 */
export function createOctokitInstance(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

/**
 * Extracts owner and repo from a GitHub repository URL
 * @param repoUrl - GitHub repository URL (e.g., "https://github.com/owner/repo")
 * @returns Object containing owner and repo name
 */
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const url = new URL(repoUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    throw new Error('Invalid repository URL format');
  }
  
  return {
    owner: pathParts[0],
    repo: pathParts[1],
  };
}

/**
 * Fetches commit history for a specific user in a GitHub repository
 * @param token - GitHub personal access token
 * @param repoUrl - GitHub repository URL
 * @param userAccount - GitHub username to filter commits by
 * @param options - Optional parameters for filtering commits
 * @returns Array of commits by the specified user
 */
export async function getUserCommitHistory(
  token: string,
  repoUrl: string,
  userAccount: string,
  options: CommitHistoryOptions = {}
): Promise<GitHubCommit[]> {
  const octokit = createOctokitInstance(token);
  const { owner, repo } = parseRepoUrl(repoUrl);
  
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      owner,
      repo,
      per_page: options.per_page || 100,
      since: options.since,
      until: options.until,
      author: userAccount,
    });
    
    return response.data as GitHubCommit[];
  } catch (error) {
    console.error('Error fetching commit history:', error);
    throw new Error(`Failed to fetch commit history: ${error}`);
  }
}

/**
 * Fetches all commits in a repository and filters by user
 * @param token - GitHub personal access token
 * @param repoUrl - GitHub repository URL
 * @param userAccount - GitHub username to filter commits by
 * @param options - Optional parameters for filtering commits
 * @returns Array of commits by the specified user
 */
export async function getAllCommitsByUser(
  token: string,
  repoUrl: string,
  userAccount: string,
  options: CommitHistoryOptions = {}
): Promise<GitHubCommit[]> {
  const octokit = createOctokitInstance(token);
  const { owner, repo } = parseRepoUrl(repoUrl);
  
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      owner,
      repo,
      per_page: options.per_page || 100,
      since: options.since,
      until: options.until,
    });
    
    // Filter commits by the specified user
    const userCommits = response.data.filter((commit) => {
      return (commit.author && commit.author.login === userAccount) || 
             (commit.committer && commit.committer.login === userAccount);
    });
    return userCommits as GitHubCommit[];
  } catch (error) {
    console.error('Error fetching all commits:', error);
    throw new Error(`Failed to fetch commits: ${error}`);
  }
}

/**
 * Gets commit statistics for a user in a repository
 * @param token - GitHub personal access token
 * @param repoUrl - GitHub repository URL
 * @param userAccount - GitHub username
 * @returns Object with commit statistics
 */
export async function getUserCommitStats(
  token: string,
  repoUrl: string,
  userAccount: string
): Promise<{
  totalCommits: number;
  firstCommit: GitHubCommit | null;
  lastCommit: GitHubCommit | null;
  commitDates: string[];
}> {
  const commits = await getAllCommitsByUser(token, repoUrl, userAccount, { per_page: 100 });
  
  if (commits.length === 0) {
    return {
      totalCommits: 0,
      firstCommit: null,
      lastCommit: null,
      commitDates: [],
    };
  }
  
  const commitDates = commits.map(commit => commit.commit.author.date);
  const sortedCommits = commits.sort((a, b) => 
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  );
  
  return {
    totalCommits: commits.length,
    firstCommit: sortedCommits[0],
    lastCommit: sortedCommits[sortedCommits.length - 1],
    commitDates,
  };
}

/**
 * Validates if a GitHub token has the necessary permissions
 * @param token - GitHub personal access token
 * @returns Promise<boolean> - true if token is valid and has repo access
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  const octokit = createOctokitInstance(token);
  
  try {
    await octokit.request("GET /user");
    return true;
  } catch (error) {
    console.error('Invalid GitHub token:', error);
    return false;
  }
}
