"use node";

import { internalAction } from "../../../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../../../_generated/api";
import { createRepositoryFromTemplate } from "../services/createRepositoryFromTemplate";
import { Id } from "../../../../../_generated/dataModel";

export const create = internalAction({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
    repositoryUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{success: boolean, repositoryId?: Id<"repository">, error?: string, instructions?: string, repositoryUrl?: string}> => {
    try {
      console.log(`Creating user repository from template: ${args.name} for user: ${args.userId}`);

      // Check if repository already exists for this user
      const existingRepo = await ctx.runQuery(internal.githubUser.repository.query.by_user_and_name, {
        userId: args.userId,
        name: args.name,
      });

      if (existingRepo) {
        throw new Error(`Repository with name "${args.name}" already exists for this user`);
      }

      // Get the default GitHub user (for template access)
      const defaultGithubUser = await ctx.runQuery(internal.githubUser.query.by_user, {
        userId: undefined,
        fallbackToDefault: true,
      });

      if (!defaultGithubUser) {
        throw new Error("No default GitHub account found. Please connect a GitHub account first.");
      }

      // Create repository name with prefix
      const importRepoName = `default-repository-${args.name}`;
      console.log(`Generating repository from template: ${importRepoName}`);

      // Generate repository from template using service
      const createdRepo = await createRepositoryFromTemplate(
        defaultGithubUser.token,
        "richisf",
        "whitenode-template",
        importRepoName,
        `Repository created from template for ${args.name}`
      );

      console.log("✅ Successfully created repository from template:", createdRepo);

      // Create database entry
      const repositoryId = await ctx.runMutation(internal.githubUser.repository.mutations.create.create, {
        userId: args.userId as Id<"users">,
        name: args.name,
        isDefault: false,
      });

      return {
        success: true,
        repositoryId,
        instructions: "✅ Repository created successfully from template!",
        repositoryUrl: createdRepo.html_url,
      };
    } catch (error) {
      console.error("User repository creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user repository",
      };
    }
  },
});
