import { HttpRouter } from "convex/server";
import { httpAction, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
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
            // Delegate OAuth processing to the fetch action
            // This action will handle token exchange and user creation
            const result = await ctx.runAction(api.githubUser.mutations.actions.fetch.fetch, {
              userId: userId as Id<"users">,
              code: code, // Pass the OAuth code directly
            });

            if (!result.success) {
              throw new Error(result.error || 'Failed to create GitHub account');
            }

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
