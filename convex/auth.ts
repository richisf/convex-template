import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

// Get current user identity
export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      subject: v.string(),
      issuer: v.string(),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.boolean()),
      name: v.optional(v.string()),
      nickname: v.optional(v.string()),
      givenName: v.optional(v.string()),
      familyName: v.optional(v.string()),
      picture: v.optional(v.string()),
      profileUrl: v.optional(v.string()),
      gender: v.optional(v.string()),
      birthday: v.optional(v.string()),
      zoneinfo: v.optional(v.string()),
      locale: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      phoneNumberVerified: v.optional(v.boolean()),
      address: v.optional(v.string()),
      updatedAt: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});
