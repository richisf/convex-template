import { httpRouter } from "convex/server";
import { auth } from "./auth";

// Import organized route handlers
import { github } from "./github";

const http = httpRouter();

// Add authentication routes
auth.addHttpRoutes(http);

// Add GitHub HTTP routes
github.addHttpRoutes(http);

export default http;
