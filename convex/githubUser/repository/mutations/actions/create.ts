"use node";

import { action } from "../../../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../../../_generated/api";
import { createRepositoryFromTemplate } from "./services/createRepositoryFromTemplate";
import { Id } from "../../../../_generated/dataModel";



export const create = action({
  args: {
    userId: v.optional(v.string()), // User ID as string (will be converted to proper format)
    name: v.optional(v.string()), // Optional - if not provided, creates default repository
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
      // Case 1: Create default repository (no userId and no name provided)
      if (!args.userId && !args.name) {
        console.log("Creating default repository...");

        // Check if default repository already exists
        const existingDefaultRepo = await ctx.runQuery(internal.githubUser.repository.query.by_user_and_name, {
          userId: undefined,
          name: "default-repository",
        });

        if (existingDefaultRepo) {
          throw new Error("Default repository already exists");
        }

        // Create the repository entry in the database
        const repositoryId: Id<"repository"> = await ctx.runMutation(internal.githubUser.repository.mutations.create.create, {
          userId: undefined,
          name: "default-repository",
          isDefault: true,
        });

        return {
          success: true,
          repositoryId,
          instructions: "✅ Default repository created successfully!",
        };
      }

      // Case 2: Create user repository from template (userId and name provided)
      if (args.userId && args.name) {
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
      }

      // Invalid combination of arguments
      throw new Error("Invalid arguments: provide either no arguments (for default repo) or both userId and name (for user repo)");
    } catch (error) {
      console.error("Repository creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      };
    }
  },
});

