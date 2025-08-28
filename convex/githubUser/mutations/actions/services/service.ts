export interface GithubUser {
  login: string;
  id: number;
  name?: string;
  email?: string;
  avatar_url: string;
}

export interface TokenExchangeResult {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Exchange OAuth authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
  }

  return {
    access_token: tokenData.access_token,
    token_type: tokenData.token_type,
    scope: tokenData.scope,
  };
}

export async function fetchGithubUser(token: string): Promise<GithubUser> {
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

