import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

export const create = internalMutation({
    args: {
      userId: v.optional(v.id("users")), // null for default accounts, set for personal accounts
      token: v.string(),
      username: v.string(),
      isDefault: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {

      if (args.userId && !args.isDefault) { 
        const existingUserAccount = await ctx.runQuery(internal.githubUser.query.by_user, {
          userId: args.userId,
          fallbackToDefault: false // Only check for user's personal account
        });

        if (existingUserAccount) {
          throw new Error("User already has a GitHub account");
        }
      }

      const existingUsername = await ctx.db
        .query("githubUser")
        .withIndex("by_user_and_username", (q) =>
          q.eq("userId", args.userId).eq("username", args.username)
        )
        .unique();

      if (existingUsername) {
        throw new Error(`GitHub user with username "${args.username}" already exists for this user`);
      }

      await ctx.db.insert("githubUser", {
        userId: args.userId,
        token: args.token,
        username: args.username,
        isDefault: args.isDefault,
      });
      return null;
    },
  });
      