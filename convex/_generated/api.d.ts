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
import type * as github from "../github.js";
import type * as githubUser_mutations_actions_fetch from "../githubUser/mutations/actions/fetch.js";
import type * as githubUser_mutations_actions_services_service from "../githubUser/mutations/actions/services/service.js";
import type * as githubUser_mutations_actions_synch from "../githubUser/mutations/actions/synch.js";
import type * as githubUser_mutations_create from "../githubUser/mutations/create.js";
import type * as githubUser_mutations_remove from "../githubUser/mutations/remove.js";
import type * as githubUser_mutations_update from "../githubUser/mutations/update.js";
import type * as githubUser_query from "../githubUser/query.js";
import type * as githubUser_repository_mutations_actions_fetch from "../githubUser/repository/mutations/actions/fetch.js";
import type * as githubUser_repository_mutations_actions_services_fetch from "../githubUser/repository/mutations/actions/services/fetch.js";
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
  github: typeof github;
  "githubUser/mutations/actions/fetch": typeof githubUser_mutations_actions_fetch;
  "githubUser/mutations/actions/services/service": typeof githubUser_mutations_actions_services_service;
  "githubUser/mutations/actions/synch": typeof githubUser_mutations_actions_synch;
  "githubUser/mutations/create": typeof githubUser_mutations_create;
  "githubUser/mutations/remove": typeof githubUser_mutations_remove;
  "githubUser/mutations/update": typeof githubUser_mutations_update;
  "githubUser/query": typeof githubUser_query;
  "githubUser/repository/mutations/actions/fetch": typeof githubUser_repository_mutations_actions_fetch;
  "githubUser/repository/mutations/actions/services/fetch": typeof githubUser_repository_mutations_actions_services_fetch;
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
