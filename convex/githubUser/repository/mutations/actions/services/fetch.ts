export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language?: string;
  default_branch: string;
}


export async function fetchGithubRepositories(token: string): Promise<GithubRepository[]> {
  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Convex-GitHub-App",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const repositories = await response.json() as Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description?: string;
    fork: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    language?: string;
    default_branch: string;
  }>;

  return repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    language: repo.language,
    default_branch: repo.default_branch,
  }));
}

export async function fetchGithubRepository(token: string, owner: string, repo: string): Promise<GithubRepository> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Convex-GitHub-App",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const repoData = await response.json();

  return {
    id: repoData.id,
    name: repoData.name,
    full_name: repoData.full_name,
    private: repoData.private,
    html_url: repoData.html_url,
    description: repoData.description,
    fork: repoData.fork,
    created_at: repoData.created_at,
    updated_at: repoData.updated_at,
    pushed_at: repoData.pushed_at,
    language: repoData.language,
    default_branch: repoData.default_branch,
  };
}

