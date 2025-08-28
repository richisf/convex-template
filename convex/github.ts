import { HttpRouter } from "convex/server";
import { httpAction, internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Generate GitHub OAuth URL with state parameter
 */
export const generateGithubOAuthUrl = mutation({
  args: {},
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Use the subject (user ID) from the identity
    const userId = identity.subject;

    // Generate state parameter: userId_timestamp
    const timestamp = Date.now();
    const state = `${userId}_${timestamp}`;

    // GitHub OAuth URL
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error("GitHub client ID not configured");
    }

    const callbackUrl = `${process.env.CONVEX_SITE_URL || "http://localhost:3210"}/github/callback`;
    const scope = "repo,user:email"; // Adjust scopes as needed

    const url = `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(state)}`;

    return { url, state };
  },
});

/**
 * GitHub OAuth state verification
 */
export const verifyOAuthState = internalMutation({
  args: {
    state: v.string(),
    expectedUserId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify the state parameter matches what we expect
    // This is a simplified version - in production you'd want more secure state management
    const [userId, timestamp] = args.state.split('_');

    if (userId !== args.expectedUserId) {
      return false;
    }

    // Check if state is not too old (e.g., 10 minutes)
    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 10 * 60 * 1000) {
      return false;
    }

    return true;
  },
});

/**
 * Create or update GitHub user account
 */
export const createOrUpdateGithubUser = internalMutation({
  args: {
    userId: v.string(), // Accept as string, convert to ID inside
    githubUsername: v.string(),
    accessToken: v.string(),
  },
  returns: v.id("githubUser"),
  handler: async (ctx, args) => {
    // Convert string to Convex ID type
    const userId = args.userId as Id<"users">;

    // Check if user already has this GitHub account connected
    const existingAccount = await ctx.db
      .query("githubUser")
      .withIndex("by_user_and_username", (q) =>
        q.eq("userId", userId).eq("username", args.githubUsername)
      )
      .first();

    if (existingAccount) {
      // Update existing account with new token
      await ctx.db.patch(existingAccount._id, {
        token: args.accessToken,
      });
      return existingAccount._id;
    }

    // Check if this GitHub account is already connected to another user
    const conflictingAccount = await ctx.db
      .query("githubUser")
      .filter((q) => q.eq(q.field("username"), args.githubUsername))
      .first();

    if (conflictingAccount && conflictingAccount.userId !== userId) {
      throw new Error("GitHub account already connected to another user");
    }

    // Create new GitHub user account
    const githubUserId = await ctx.db.insert("githubUser", {
      userId: userId,
      token: args.accessToken,
      username: args.githubUsername,
      isDefault: false,
    });

    return githubUserId;
  },
});

/**
 * Exchange OAuth code for access token
 */
async function exchangeCodeForToken(code: string): Promise<{ access_token: string; login: string }> {
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

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/json',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  const userData = await userResponse.json();

  return {
    access_token: tokenData.access_token,
    login: userData.login,
  };
}

/**
 * GitHub HTTP routes configuration
 */
const githubRoutes = {
  addHttpRoutes: (http: HttpRouter) => {
    // GitHub OAuth callback endpoint
    http.route({
      path: "/github/callback",
      method: "GET",
      handler: httpAction(async (ctx, req) => {
        try {
          const url = new URL(req.url);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          // Handle OAuth errors
          if (error) {
            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=${error}&error_message=OAuth authorization failed`
              }
            });
          }

          // Validate required parameters
          if (!code) {
            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=missing_code&error_message=Missing authorization code`
              }
            });
          }

          if (!state) {
            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=missing_state&error_message=Missing state parameter`
              }
            });
          }

          // Parse state to get user ID
          const [userId, timestamp] = state.split('_');
          if (!userId || !timestamp) {
            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=invalid_state&error_message=Invalid state parameter`
              }
            });
          }

          // Verify state is not too old
          const stateAge = Date.now() - parseInt(timestamp);
          if (stateAge > 10 * 60 * 1000) { // 10 minutes
            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=expired_state&error_message=State parameter expired`
              }
            });
          }

          try {
            // Exchange code for access token
            const { access_token, login } = await exchangeCodeForToken(code);

            // Create or update GitHub user account
            await ctx.runMutation(internal.github.createOrUpdateGithubUser, {
              userId: userId, // Pass as string, mutation will handle conversion
              githubUsername: login,
              accessToken: access_token,
            });

            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/dashboard?success=github_connected`
              }
            });

          } catch (tokenError) {
            console.error('Token exchange error:', tokenError);
            const message = tokenError instanceof Error ? tokenError.message : 'oauth_processing_failed';
            const errorCode = message.includes('already has a GitHub account connected')
              ? 'github_already_connected'
              : message.includes('GitHub account already connected to another user')
              ? 'github_account_taken'
              : 'oauth_processing_failed';

            return new Response(null, {
              status: 302,
              headers: {
                "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=${errorCode}&error_message=${encodeURIComponent(message)}`
              }
            });
          }

        } catch (error) {
          console.error('GitHub OAuth callback error:', error);
          return new Response(null, {
            status: 302,
            headers: {
              "Location": `${process.env.SITE_URL || "http://localhost:3000"}/onboarding?error=server_error&error_message=unexpected_server_error`
            }
          });
        }
      }),
    });
  }
};

export const github = githubRoutes;
