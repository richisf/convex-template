import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("githubUser", {
      userId: args.userId,
      token: args.token,
      username: args.username,
    });
    return null;
  },
});

export const update = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubUser")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) {
      throw new Error(`GitHub account not found for user ${args.userId}`);
    }
    await ctx.db.patch(existing._id, {
      token: args.token,
      username: args.username,
    });
    return null;
  },
});

export const remove = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubUser")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing) {
      throw new Error(`GitHub account not found for user ${args.userId}`);
    }
    await ctx.db.delete(existing._id);
    return null;
  },
});
