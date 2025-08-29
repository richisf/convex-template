"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export function SignOut() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push("/signin");
    });
  };

  return (
    <button
      className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
