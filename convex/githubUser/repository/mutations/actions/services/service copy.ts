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

export interface CreateRepositoryOptions {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}

export interface ImportRepositoryOptions {
  vcs_url: string; // The URL of the source repository
  vcs_username?: string; // Username for private repos
  vcs_password?: string; // Access token or password for private repos
  vcs?: 'git' | 'mercurial' | 'subversion' | 'tfvc'; // Version control system
}

/**
 * Create a new repository on GitHub
 */
export async function createGithubRepository(
  token: string,
  options: CreateRepositoryOptions
): Promise<GithubRepository> {
  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Convex-GitHub-App",
      "Content-Type": "application/json",
      "Accept": "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      private: options.private ?? false,
      auto_init: options.auto_init ?? false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create repository: ${response.status} ${response.statusText}. ${
        errorData.message || ""
      }`
    );
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

/**
 * Import/clone a repository from another source into GitHub
 * This uses GitHub's repository import API which handles the cloning process
 */
export async function importGithubRepository(
  token: string,
  owner: string,
  repoName: string,
  importOptions: ImportRepositoryOptions
): Promise<{ status_url: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/import`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
      },
      body: JSON.stringify({
        vcs_url: importOptions.vcs_url,
        vcs_username: importOptions.vcs_username,
        vcs_password: importOptions.vcs_password,
        vcs: importOptions.vcs || "git",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to import repository: ${response.status} ${response.statusText}. ${
        errorData.message || ""
      }`
    );
  }

  const importData = await response.json();
  return {
    status_url: importData.status_url,
  };
}

/**
 * Check the status of an ongoing repository import
 */
export async function getImportStatus(
  token: string,
  owner: string,
  repoName: string
): Promise<{
  status: string;
  url?: string;
  repository_url?: string;
  message?: string;
}> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/import`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Accept": "application/vnd.github+json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Import not found or already completed");
    }
    throw new Error(
      `Failed to get import status: ${response.status} ${response.statusText}`
    );
  }

  const statusData = await response.json();
  return {
    status: statusData.status,
    url: statusData.url,
    repository_url: statusData.repository_url,
    message: statusData.message,
  };
}

/**
 * Cancel an ongoing repository import
 */
export async function cancelImport(
  token: string,
  owner: string,
  repoName: string
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/import`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Accept": "application/vnd.github+json",
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to cancel import: ${response.status} ${response.statusText}`
    );
  }
}