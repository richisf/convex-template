import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public mutation to store GitHub token (can be called from client)
 */
export const githubMutation = mutation({
  args: {
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("github", {
      token: args.token,
      username: args.username,
    });
    return null;
  },
});

/**
 * Public query to get GitHub token for a username
 */
export const githubQuery = query({
  args: {
    username: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("github"),
      _creationTime: v.number(),
      token: v.string(),
      username: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("github")
      .filter((q) => q.eq(q.field("username"), args.username))
      .unique();
  },
});

/**
 * Internal mutation to store GitHub token (for use from actions)
 */
export const githubInternalMutation = internalMutation({
  args: {
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("github", {
      token: args.token,
      username: args.username,
    });
    return null;
  },
});


