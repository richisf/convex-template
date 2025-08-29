import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  githubUser: defineTable({
    userId: v.optional(v.string()), // user subject string or null for default/shared account
    token: v.string(),
    username: v.string(),
    isDefault: v.optional(v.boolean()), // true = can be used as default for any repository
  })
    .index("by_user", ["userId"])
    .index("by_default", ["isDefault"])
    .index("by_user_and_username", ["userId", "username"]), // Unique constraint: user can't have duplicate GitHub usernames

    repository: defineTable({
      userId: v.optional(v.string()), // user subject string or null for default repository
      githubUserId: v.id("githubUser"), // repository must be linked to a GitHub user
      name: v.string(),
      isDefault: v.optional(v.boolean()), // true = can be used as default repository
    })
      .index("by_user", ["userId"])
      .index("by_github_user", ["githubUserId"])
      .index("by_user_and_github_user", ["userId", "githubUserId"])
      .index("by_user_and_name", ["userId", "name"]) // Unique constraint: user can't have duplicate repository names
      .index("by_default", ["isDefault"]), // Unique constraint: only one default repository
  
});
