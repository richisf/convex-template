"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { fetchGitHubUserData } from "./service";

/**
 * Fetch GitHub user info and store token
 */
export const githubAction = action({
  args: {
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Call utility function to fetch user data
    const userData = await fetchGitHubUserData(args.token);

    // Store in database using internal mutation
    await ctx.runMutation(internal.github.githubInternalMutation, {
      token: args.token,
      username: userData.login,
    });

    console.log(`Stored GitHub token for user: ${userData.login}`);

    return null;
  },
});