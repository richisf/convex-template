import { internalMutation } from "../../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../../_generated/dataModel";

export const create = internalMutation({
  args: {
    repositoryId: v.id("repository"),
    name: v.string(),
    zone: v.string(),
  },
  returns: v.id("machine"),
  handler: async (ctx, args): Promise<Id<"machine">> => {
    // Verify repository exists
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      throw new Error("Repository not found");
    }

    // Check for duplicate VM name within this repository
    const existingVM = await ctx.db
      .query("machine")
      .withIndex("by_repository_and_name", (q) =>
        q.eq("repositoryId", args.repositoryId).eq("name", args.name)
      )
      .unique();

    if (existingVM) {
      throw new Error(`VM with name "${args.name}" already exists in this repository`);
    }

    return await ctx.db.insert("machine", {
      repositoryId: args.repositoryId,
      name: args.name,
      zone: args.zone,
      state: "pending", // Machines start in pending state
    });
  },
});
