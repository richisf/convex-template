import { mutation } from "../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../_generated/api";
import { Doc, Id } from "../../../_generated/dataModel";

export const create = mutation({
  args: {
    userId: v.optional(v.id("users")), // Now optional to support default repositories
    name: v.string(),
    isDefault: v.optional(v.boolean()), // New field to mark as default repository
  },
  returns: v.id("repository"),
  handler: async (ctx, args): Promise<Id<"repository">> => {
    // If creating a default repository, userId should be null
    if (args.isDefault) {
      args.userId = undefined;
    }

    // If this is a default repository, ensure no other default exists
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("repository")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();

      if (existingDefault) {
        throw new Error("A default repository already exists");
      }
    }

    // Get GitHub account - either user's or default
    let githubUser: Doc<"githubUser"> | null = null;

    if (args.userId) {
      // For personal repositories, get user's GitHub account with fallback to default
      githubUser = await ctx.runQuery(internal.githubUser.query.by_user, {
        userId: args.userId,
        fallbackToDefault: true
      });
    } else {
      // For default repositories, get the default GitHub account
      githubUser = await ctx.db
        .query("githubUser")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();
    }

    if (!githubUser) {
      throw new Error("No GitHub account available - neither personal nor default account found");
    }

    // Check for uniqueness: user can't have duplicate repository names
    const existing = await ctx.db
      .query("repository")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", args.userId).eq("name", args.name)
      )
      .unique();

    if (existing) {
      const scope = args.userId ? "this user" : "default repositories";
      throw new Error(`repository with name "${args.name}" already exists for ${scope}`);
    }

    return await ctx.db.insert("repository", {
      userId: args.userId,
      githubUserId: githubUser._id,
      name: args.name,
      isDefault: args.isDefault,
    });
  },
});
