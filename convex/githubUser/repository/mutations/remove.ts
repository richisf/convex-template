import { mutation } from "../../../_generated/server";
import { v } from "convex/values";

export const remove = mutation({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.repositoryId);
    if (!existing) {
      throw new Error(`repository not found: ${args.repositoryId}`);
    }
    await ctx.db.delete(args.repositoryId);
    return null;
  },
});
