"use node";

import { action } from "../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../_generated/api";
import { fetchGithubUser } from "./services/service";

export const fetch = action({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    username: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Fetch and validate GitHub user data
      const userData = await fetchGithubUser(args.token);

      await ctx.runMutation(internal.githubUser.mutations.create.create, {
        userId: args.userId,
        token: args.token,
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
