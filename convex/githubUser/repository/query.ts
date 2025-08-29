import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";


export const by_user = internalQuery({
  args: {
    userId: v.optional(v.string()), // user subject string or null for default repositories
    fallbackToDefault: v.optional(v.boolean()), // If true, falls back to default if user has no repositories
  },
  returns: v.array(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()), // user subject string or null
      githubUserId: v.id("githubUser"),
      name: v.string(),
      isDefault: v.optional(v.boolean()), // New field
    })
  ),
  handler: async (ctx, args) => {
    // If userId is provided, get user's repositories
    if (args.userId) {
      const userRepos = await ctx.db
        .query("repository")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      // If fallback is enabled and no user repositories, include default
      if (args.fallbackToDefault && userRepos.length === 0) {
        const defaultRepo = await ctx.db
          .query("repository")
          .withIndex("by_default", (q) => q.eq("isDefault", true))
          .unique();

        return defaultRepo ? [defaultRepo] : [];
      }

      return userRepos;
    }

    // If no userId provided, return default repository if it exists
    if (args.fallbackToDefault) {
      const defaultRepo = await ctx.db
        .query("repository")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();

      return defaultRepo ? [defaultRepo] : [];
    }

    return [];
  },
});

export const by_user_and_name = internalQuery({
  args: {
    userId: v.optional(v.string()), // user subject string or null
    name: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()), // user subject string or null
      githubUserId: v.id("githubUser"),
      name: v.string(),
      isDefault: v.optional(v.boolean()), // New field
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // If userId is provided, look for user's repository
    if (args.userId) {
      return await ctx.db
        .query("repository")
        .withIndex("by_user_and_name", (q) =>
          q.eq("userId", args.userId).eq("name", args.name)
        )
        .unique();
    }

    // If no userId, look for default repository with this name
    return await ctx.db
      .query("repository")
      .filter((q) =>
        q.eq(q.field("name"), args.name)
      )
      .filter((q) => q.eq(q.field("userId"), null))
      .unique();
  },
});


