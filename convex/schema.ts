import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  githubUser: defineTable({
    userId: v.id("users"),
    token: v.string(),
    username: v.string(),
  }).index("by_user", ["userId"]),
});
