import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

export const remove = internalMutation({
  args: {
    userId: v.id("users"), // Required for personal accounts
  },
  returns: v.null(),
  handler: async (ctx, args) => {

    const githubUser = await ctx.runQuery(internal.githubUser.query.by_user, {
      userId: args.userId,
      fallbackToDefault: false
    });

    if (!githubUser) {
      throw new Error(`GitHub account not found for user`);
    }

    await ctx.db.delete(githubUser._id);
    return null;
  },
});