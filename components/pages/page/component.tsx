"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function Page() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  // Get the current user from the auth system
  const currentUser = useQuery(api.auth.currentUser);
  const createRepository = useAction(api.githubUser.repository.mutations.actions.create.create);

  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{success: boolean, repositoryId?: string, error?: string, instructions?: string, repositoryUrl?: string} | null>(null);
  const [repoName, setRepoName] = useState("");

  const handleCreateDefaultRepository = async () => {
    setIsCreating(true);
    setCreateResult(null);
    try {
      const result = await createRepository({});
      setCreateResult(result);
    } catch (error) {
      setCreateResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository"
      });
    } finally {
      setIsCreating(false);
    }
  };

    const handleCreateNamedRepository = async () => {
    if (!repoName.trim()) {
      setCreateResult({
        success: false,
        error: "Please enter a repository name"
      });
      return;
    }

    setIsCreating(true);
    setCreateResult(null);

                                    console.log("Current user:", currentUser);
    console.log("Is authenticated:", isAuthenticated);

    if (currentUser === undefined) {
      console.log("Current user is still loading...");
      setCreateResult({
        success: false,
        error: "Loading user information..."
      });
      setIsCreating(false);
      return;
    }

    if (!currentUser || !currentUser.subject) {
      console.error("No current user found");
      setCreateResult({
        success: false,
        error: "Please sign in again."
      });
      setIsCreating(false);
      return;
    }

    // Just pass the subject as-is - let the backend handle it
    console.log("User subject:", currentUser.subject);

    try {
      const result = await createRepository({
        name: repoName.trim(),
        userId: currentUser.subject // Pass the raw subject
      });
      setCreateResult(result);
      if (result.success) {
        setRepoName(""); // Clear the input on success
      }
    } catch (error) {
      setCreateResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository"
      });
    } finally {
      setIsCreating(false);
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      {isAuthenticated ? (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Create Your Repository</h2>

          <div className="flex flex-col items-center gap-2 w-full max-w-md">
            <input
              type="text"
              placeholder="Enter repository name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
              disabled={isCreating || currentUser === undefined}
            />

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-50 w-full"
              onClick={handleCreateNamedRepository}
              disabled={isCreating || !repoName.trim() || currentUser === undefined}
            >
              {isCreating ? "Creating Repository..." :
               currentUser === undefined ? "Loading..." :
               "Create Repository from Template"}
            </button>
          </div>

          {createResult && (
            <div className={`p-4 rounded-md max-w-md text-center w-full ${
              createResult.success
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}>
              {createResult.success ? (
                <div>
                  <p className="font-medium">Repository created successfully!</p>
                  <p className="text-sm mt-1">Repository ID: {createResult.repositoryId}</p>
                  {createResult.instructions && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <p className="font-medium mb-2">📝 Instructions:</p>
                      <pre className="text-xs whitespace-pre-wrap">{createResult.instructions}</pre>
                    </div>
                  )}
                  {createResult.repositoryUrl && (
                    <p className="text-xs mt-2">
                      <a href={createResult.repositoryUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                        View Repository on GitHub →
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">Failed to create repository</p>
                  <p className="text-sm mt-1">{createResult.error}</p>
                </div>
              )}
            </div>
          )}

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
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Welcome to WhiteNode</h2>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-50"
            onClick={handleCreateDefaultRepository}
            disabled={isCreating}
          >
            {isCreating ? "Creating Repository..." : "Create WhiteNode Template Repository"}
          </button>

          {createResult && (
            <div className={`p-4 rounded-md max-w-md text-center ${
              createResult.success
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}>
              {createResult.success ? (
                <div>
                  <p className="font-medium">Repository created successfully!</p>
                  <p className="text-sm mt-1">Repository ID: {createResult.repositoryId}</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Failed to create repository</p>
                  <p className="text-sm mt-1">{createResult.error}</p>
                </div>
              )}
            </div>
          )}

          <button
            className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2"
            onClick={() => router.push("/signin")}
          >
            Sign in
          </button>

          <button
            className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-4 py-2"
            onClick={() => router.push("/github")}
          >
            Sign in with GitHub
          </button>
        </div>
      )}
    </div>
  );
}
