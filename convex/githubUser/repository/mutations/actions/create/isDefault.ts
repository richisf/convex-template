"use node";

import { internalAction } from "../../../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../../../_generated/api";
import { Id } from "../../../../../_generated/dataModel";

export const create = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
  }),
  handler: async (ctx): Promise<{success: boolean, repositoryId?: Id<"repository">, error?: string, instructions?: string}> => {
    try {
      console.log("Creating default repository...");

      // Check if default repository already exists
      const existingDefaultRepo = await ctx.runQuery(internal.githubUser.repository.query.by_user_and_name, {
        userId: undefined,
        name: "default-repository",
      });

      if (existingDefaultRepo) {
        throw new Error("Default repository already exists");
      }

      // Create the repository entry in the database
      const repositoryId: Id<"repository"> = await ctx.runMutation(internal.githubUser.repository.mutations.create.create, {
        userId: undefined,
        name: "default-repository",
        isDefault: true,
      });

      return {
        success: true,
        repositoryId,
        instructions: "✅ Default repository created successfully!",
      };
    } catch (error) {
      console.error("Default repository creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create default repository",
      };
    }
  },
});
