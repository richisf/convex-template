"use node";

import { action } from "../../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../../_generated/api";
import { Id } from "../../../../_generated/dataModel";

export const create = action({
  args: {
    userId: v.optional(v.string()), // User ID as string (will be converted to proper format)
    name: v.optional(v.string()), // Optional - if not provided, creates default repository
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
    repositoryUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{success: boolean, repositoryId?: Id<"repository">, error?: string, instructions?: string, repositoryUrl?: string}> => {
    try {
      // Case 1: Create default repository (no userId and no name provided)
      if (!args.userId && !args.name) {
        console.log("Routing to default repository creation...");
        return await ctx.runAction(internal.githubUser.repository.mutations.actions.create.isDefault.create, {});
      }

      // Case 2: Create user repository from template (userId and name provided)
      if (args.userId && args.name) {
        console.log("Routing to user repository creation...");
        return await ctx.runAction(internal.githubUser.repository.mutations.actions.create.isNotDefault.create, {
          userId: args.userId,
          name: args.name,
        });
      }

      // Invalid combination of arguments
      throw new Error("Invalid arguments: provide either no arguments (for default repo) or both userId and name (for user repo)");
    } catch (error) {
      console.error("Repository creation routing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      };
    }
  },
});

