/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as githubUser_mutations_actions_create from "../githubUser/mutations/actions/create.js";
import type * as githubUser_mutations_actions_services_exchangeCodeForToken from "../githubUser/mutations/actions/services/exchangeCodeForToken.js";
import type * as githubUser_mutations_actions_services_fetchGithubUser from "../githubUser/mutations/actions/services/fetchGithubUser.js";
import type * as githubUser_mutations_create from "../githubUser/mutations/create.js";
import type * as githubUser_mutations_remove from "../githubUser/mutations/remove.js";
import type * as githubUser_query from "../githubUser/query.js";
import type * as githubUser_repository_mutations_actions_create from "../githubUser/repository/mutations/actions/create.js";
import type * as githubUser_repository_mutations_actions_services_createRepositoryFromTemplate from "../githubUser/repository/mutations/actions/services/createRepositoryFromTemplate.js";
import type * as githubUser_repository_mutations_actions_services_fetchGithubRepositories from "../githubUser/repository/mutations/actions/services/fetchGithubRepositories.js";
import type * as githubUser_repository_mutations_actions_services_fetchGithubRepository from "../githubUser/repository/mutations/actions/services/fetchGithubRepository.js";
import type * as githubUser_repository_mutations_create from "../githubUser/repository/mutations/create.js";
import type * as githubUser_repository_mutations_remove from "../githubUser/repository/mutations/remove.js";
import type * as githubUser_repository_mutations_update from "../githubUser/repository/mutations/update.js";
import type * as githubUser_repository_query from "../githubUser/repository/query.js";
import type * as http from "../http.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "githubUser/mutations/actions/create": typeof githubUser_mutations_actions_create;
  "githubUser/mutations/actions/services/exchangeCodeForToken": typeof githubUser_mutations_actions_services_exchangeCodeForToken;
  "githubUser/mutations/actions/services/fetchGithubUser": typeof githubUser_mutations_actions_services_fetchGithubUser;
  "githubUser/mutations/create": typeof githubUser_mutations_create;
  "githubUser/mutations/remove": typeof githubUser_mutations_remove;
  "githubUser/query": typeof githubUser_query;
  "githubUser/repository/mutations/actions/create": typeof githubUser_repository_mutations_actions_create;
  "githubUser/repository/mutations/actions/services/createRepositoryFromTemplate": typeof githubUser_repository_mutations_actions_services_createRepositoryFromTemplate;
  "githubUser/repository/mutations/actions/services/fetchGithubRepositories": typeof githubUser_repository_mutations_actions_services_fetchGithubRepositories;
  "githubUser/repository/mutations/actions/services/fetchGithubRepository": typeof githubUser_repository_mutations_actions_services_fetchGithubRepository;
  "githubUser/repository/mutations/create": typeof githubUser_repository_mutations_create;
  "githubUser/repository/mutations/remove": typeof githubUser_repository_mutations_remove;
  "githubUser/repository/mutations/update": typeof githubUser_repository_mutations_update;
  "githubUser/repository/query": typeof githubUser_repository_query;
  http: typeof http;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
