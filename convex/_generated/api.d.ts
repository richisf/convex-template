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
import type * as githubUser_actions_fetch from "../githubUser/actions/fetch.js";
import type * as githubUser_actions_services_service from "../githubUser/actions/services/service.js";
import type * as githubUser_actions_synch from "../githubUser/actions/synch.js";
import type * as githubUser_mutation from "../githubUser/mutation.js";
import type * as githubUser_query from "../githubUser/query.js";
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
  "githubUser/actions/fetch": typeof githubUser_actions_fetch;
  "githubUser/actions/services/service": typeof githubUser_actions_services_service;
  "githubUser/actions/synch": typeof githubUser_actions_synch;
  "githubUser/mutation": typeof githubUser_mutation;
  "githubUser/query": typeof githubUser_query;
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
