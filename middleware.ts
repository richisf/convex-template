import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);
const isGithubOAuthPage = createRouteMatcher(["/github"]);
const isGithubOAuthCallback = createRouteMatcher(["/github/callback"]);
const isProtectedRoute = createRouteMatcher(["/", "/server"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Completely skip OAuth routes - don't even check authentication
  if (isGithubOAuthPage(request) || isGithubOAuthCallback(request)) {
    return; // Skip all middleware processing for OAuth flows
  }
  
  // Skip GitHub callback route by path check as well
  if (request.nextUrl.pathname.includes('/github/callback')) {
    return;
  }
  
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and GitHub OAuth routes.
  matcher: [
    "/((?!.*\\.|_next|github/callback).*)",
    "/",
    "/api/*",
    "/trpc/*"
  ],
};
