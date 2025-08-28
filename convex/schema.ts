import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Simple table for GitHub tokens
  github: defineTable({
    token: v.string(),
    username: v.string(),
  }),
});
