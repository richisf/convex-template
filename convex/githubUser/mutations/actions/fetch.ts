"use node";

import { action } from "../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../_generated/api";
import { fetchGithubUser, exchangeCodeForToken } from "./services/service";

export const fetch = action({
  args: {
    userId: v.id("users"),
    code: v.string(), // OAuth authorization code instead of token
  },
  returns: v.object({
    success: v.boolean(),
    username: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Exchange OAuth code for access token
      const tokenData = await exchangeCodeForToken(args.code);

      // Fetch and validate GitHub user data
      const userData = await fetchGithubUser(tokenData.access_token);

      // Create GitHub user account
      await ctx.runMutation(internal.githubUser.mutations.create.create, {
        userId: args.userId,
        token: tokenData.access_token,
        username: userData.login,
      });

      return {
        success: true,
        username: userData.login,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect GitHub account",
      };
    }
  },
});
