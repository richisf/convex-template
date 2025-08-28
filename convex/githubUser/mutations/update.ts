import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

export const update = internalMutation({
  args: {
    userId: v.id("users"), // Required for personal accounts
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {

      const existing = await ctx.runQuery(internal.githubUser.query.by_user, {
      userId: args.userId,
      fallbackToDefault: false 
    });

    if (!existing) {
      throw new Error("GitHub user not found");
    }

    if (existing.username !== args.username) {
      const duplicate = await ctx.db
        .query("githubUser")
        .withIndex("by_user_and_username", (q) =>
          q.eq("userId", args.userId).eq("username", args.username)
        )
        .unique();

      if (duplicate && duplicate._id !== existing._id) {
        throw new Error(`GitHub user with username "${args.username}" already exists for this user`);
      }
    }

    await ctx.db.patch(existing._id, {
      token: args.token,
      username: args.username,
    });

    return null;
  },
});
