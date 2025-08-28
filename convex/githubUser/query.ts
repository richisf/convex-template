import { v } from "convex/values";
import { query } from "../_generated/server";

export const read = query({
    args: {
      userId: v.id("users"),
    },
    returns: v.union(
      v.object({
        _id: v.id("githubUser"),
        _creationTime: v.number(),
        userId: v.id("users"),
        token: v.string(),
        username: v.string(),
      }),
      v.null()
    ),
    handler: async (ctx, args) => {
      return await ctx.db
        .query("githubUser")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();
    },
});