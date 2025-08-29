"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

interface CreateRepositoryProps {
  currentUser: { subject: string; email?: string; name?: string } | null;
  onRepositoryCreated?: () => void;
}

export function CreateRepository({ currentUser, onRepositoryCreated }: CreateRepositoryProps) {
  const createRepository = useAction(api.githubUser.repository.mutations.actions.create.create);

  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success: boolean,
    repositoryId?: string,
    error?: string,
    repositoryUrl?: string
  } | null>(null);
  const [repoName, setRepoName] = useState("");

  const handleCreateNamedRepository = async () => {
    // Validate repository name
    if (!repoName.trim()) {
      setCreateResult({
        success: false,
        error: "Please enter a repository name"
      });
      return;
    }

    // Check user authentication state
    if (!currentUser?.subject) {
      setCreateResult({
        success: false,
        error: "Please sign in again."
      });
      return;
    }

    setIsCreating(true);
    setCreateResult(null);

    try {
      const result = await createRepository({
        name: repoName.trim(),
        userId: currentUser.subject
      });

      setCreateResult(result);
      if (result.success) {
        setRepoName(""); // Clear the input on success
        onRepositoryCreated?.();
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
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Create Your Repository</h2>

      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter repository name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
          disabled={isCreating}
        />

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-50 w-full"
          onClick={handleCreateNamedRepository}
          disabled={isCreating || !repoName.trim()}
        >
          {isCreating ? "Creating Repository..." : "Create Repository from Template"}
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
              <p className="font-medium mb-2">✅ Repository created!</p>
              {createResult.repositoryUrl && (
                <a
                  href={createResult.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  View on GitHub →
                </a>
              )}
            </div>
          ) : (
            <div>
              <p className="font-medium">❌ Failed to create repository</p>
              <p className="text-sm mt-1">{createResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
