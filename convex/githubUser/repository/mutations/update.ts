import { mutation } from "../../../_generated/server";
import { v } from "convex/values";

export const update = mutation({
  args: {
    repositoryId: v.id("repository"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.repositoryId);
    if (!existing) {
      throw new Error(`repository not found: ${args.repositoryId}`);
    }

    // Check for uniqueness: user can't have duplicate repository names
    const duplicate = await ctx.db
      .query("repository")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", existing.userId).eq("name", args.name)
      )
      .unique();

    if (duplicate && duplicate._id !== args.repositoryId) {
      const scope = existing.userId ? "this user" : "default repositories";
      throw new Error(`repository with name "${args.name}" already exists for ${scope}`);
    }

    await ctx.db.patch(args.repositoryId, {
      name: args.name,
    });
    return null;
  },
});
