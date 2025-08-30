import { internalQuery, query } from "../../_generated/server";
import { v } from "convex/values";


// Public queries for client-side access
export const getDefaultRepository = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      githubUserId: v.id("githubUser"),
      name: v.string(),
      isDefault: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const defaultRepo = await ctx.db
      .query("repository")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .unique();

    return defaultRepo;
  },
});

export const getRepositoriesByUser = query({
  args: {
    userId: v.optional(v.string()),
    fallbackToDefault: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      githubUserId: v.id("githubUser"),
      name: v.string(),
      isDefault: v.optional(v.boolean()),
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

// Internal queries for server-side use
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

export const by_id = internalQuery({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.union(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      githubUserId: v.id("githubUser"),
      name: v.string(),
      isDefault: v.optional(v.boolean()),
      // Include GitHub user data for repository setup
      accessToken: v.optional(v.string()),
      fullName: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      return null;
    }

    // Get the associated GitHub user to include token and username
    const githubUser = await ctx.db.get(repository.githubUserId);
    if (!githubUser) {
      return {
        ...repository,
        accessToken: undefined,
        fullName: undefined,
      };
    }

    // Construct full repository name as "username/repo-name"
    const fullName = `${githubUser.username}/${repository.name}`;

    return {
      ...repository,
      accessToken: githubUser.token,
      fullName,
    };
  },
});


