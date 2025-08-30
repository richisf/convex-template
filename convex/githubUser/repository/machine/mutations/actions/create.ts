"use node";

import { action } from "../../../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../../../_generated/api";
import { Id } from "../../../../../_generated/dataModel";

export const create = action({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.object({
    success: v.boolean(),
    machineId: v.optional(v.id("machine")),
    error: v.optional(v.string()),
    name: v.optional(v.string()),
    zone: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    machineId?: Id<"machine">,
    error?: string,
    name?: string,
    zone?: string
  }> => {
    try {
      const repository = await ctx.runQuery(internal.githubUser.repository.query.by_id, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      console.log(`🆕 Creating new machine for repository: ${repository.name}`);

      const { create } = await import('./services/create');
      const result = await create(repository);

      {/*const devServerSetup = {
        domain: "dev.whitenode.dev",
        email: "admin@whitenode.dev", 
        port: 3000
      };
      const result = await create(repository, devServerSetup);
      */}

      if (!result.success) {
        console.error(`❌ VM creation failed: ${result.error}`);
        return {
          success: false,
          error: result.error || "VM creation failed",
        };
      }

      const machineId = await ctx.runMutation(internal.githubUser.repository.machine.mutations.create.create, {
        repositoryId: args.repositoryId,
        name: result.name,
        zone: result.zone,
      });

      console.log(`✅ Machine record created: ${machineId}`);

      return {
        success: true,
        machineId,
        name: result.name,
        zone: result.zone,
      };
    } catch (error) {
      console.error("Machine creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create machine",
      };
    }
  },
});
