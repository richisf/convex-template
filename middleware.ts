import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);
const isGithubOAuthPage = createRouteMatcher(["/github"]);
const isGithubOAuthCallback = createRouteMatcher(["/api/github/callback", "/api/test-oauth"]);
const isProtectedRoute = createRouteMatcher(["/", "/server"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Completely skip OAuth routes - don't even check authentication
  if (isGithubOAuthPage(request) || isGithubOAuthCallback(request)) {
    return; // Skip all middleware processing for OAuth flows
  }
  
  // Skip OAuth API routes by path check as well
  if (request.nextUrl.pathname.includes('/api/test-oauth') || 
      request.nextUrl.pathname.includes('/api/github')) {
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
  // except static assets and OAuth routes.
  matcher: [
    "/((?!.*\\.|_next|api/test-oauth|api/github).*)", 
    "/", 
    "/(api|trpc)(?!/test-oauth|/github)(.*)"
  ],
};
