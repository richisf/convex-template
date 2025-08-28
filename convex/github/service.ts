/**
 * GitHub API utility functions
 * These are regular TypeScript functions that can be imported and used within actions
 * They contain the actual HTTP call logic but are not Convex functions themselves
 */

export interface GitHubUser {
  login: string;
  id: number;
  name?: string;
  email?: string;
  avatar_url: string;
}


/**
 * Utility function to fetch GitHub user data
 * This is a plain function that can be called from within actions
 */
export async function fetchGitHubUserData(token: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Convex-GitHub-App",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const userData = await response.json();

  return {
    login: userData.login,
    id: userData.id,
    name: userData.name,
    email: userData.email,
    avatar_url: userData.avatar_url,
  };
}

