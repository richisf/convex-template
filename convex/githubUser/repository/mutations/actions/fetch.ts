"use node";

import { action } from "../../../../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../../../../_generated/api";
import { fetchGithubRepositories, fetchGithubRepository } from "./services/fetch";

export const createDefaultRepository = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get the default GitHub account
    const defaultGithubAccount = await ctx.runQuery(internal.githubUser.query.by_user, {
      userId: undefined,
      fallbackToDefault: true,
    });
    
    if (!defaultGithubAccount) {
      throw new Error("No default GitHub account found");
    }

    // Fetch all repositories from the default GitHub account
    const repositories = await fetchGithubRepositories(defaultGithubAccount.token);
    
    // Search for a repository named 'default'
    const defaultRepo = repositories.find(repo => repo.name === 'default');
    
    if (!defaultRepo) {
      throw new Error("No repository named 'default' found in the default GitHub account");
    }

    // Fetch detailed information about the default repository
    const repoDetails = await fetchGithubRepository(
      defaultGithubAccount.token,
      defaultGithubAccount.username,
      'default'
    );

    // Create the default repository in our database
    await ctx.runMutation(api.githubUser.repository.mutations.create.create, {
      name: repoDetails.name,
      isDefault: true,
    });

    return null;
  },
});
