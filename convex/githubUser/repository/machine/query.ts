import { internalQuery } from "../../../_generated/server";
import { v } from "convex/values";

export const by_repository = internalQuery({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.array(
    v.object({
      _id: v.id("machine"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("machine")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .collect();
  },
});

export const by_repository_and_name = internalQuery({
  args: {
    repositoryId: v.id("repository"),
    name: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("machine"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("machine")
      .withIndex("by_repository_and_name", (q) =>
        q.eq("repositoryId", args.repositoryId).eq("name", args.name)
      )
      .unique();
  },
});

export const by_state = internalQuery({
  args: {
    state: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("machine"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("machine")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();
  },
});
