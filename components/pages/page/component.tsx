"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export function Page() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {isAuthenticated ? (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2"
          onClick={() =>
            void signOut().then(() => {
              router.push("/signin");
            })
          }
        >
          Sign out
        </button>
      ) : (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2"
          onClick={() => router.push("/signin")}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
