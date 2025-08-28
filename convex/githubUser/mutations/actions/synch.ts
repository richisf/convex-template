"use node";

import { action } from "../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../_generated/api";
import { fetchGithubUser } from "./services/service";

export const synch = action({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    updated: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {

      const existingRecord = await ctx.runQuery(internal.githubUser.query.by_user, { userId: args.userId, fallbackToDefault: true });
      if (!existingRecord) {
        return {
          success: false,
          error: "No GitHub account connected",
        };
      }

      const userData = await fetchGithubUser(existingRecord.token);

      if (userData.login !== existingRecord.username) {

        await ctx.runMutation(internal.githubUser.mutations.update.update, {
          userId: args.userId,
          token: existingRecord.token,
          username: userData.login,
        });
        return {
          success: true,
          updated: true,
        };
      }

      return {
        success: true,
        updated: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync GitHub account",
      };
    }
  },
});
