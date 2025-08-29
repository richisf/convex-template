"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Page() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Show loading while redirecting authenticated users
  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <p className="text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <div className="flex flex-col items-center gap-4">

        <button
          className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2"
          onClick={() => router.push("/signin")}
        >
          Sign in
        </button>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2"
          onClick={() => router.push("/github")}
        >
          Connect GitHub
        </button>
      </div>
    </div>
  );
}
