"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreateResult {
  success: boolean;
  repositoryId?: string;
  error?: string;
  instructions?: string;
  repositoryUrl?: string;
}

export function DefaultRepositoryCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);

  const createRepository = useAction(api.githubUser.repository.mutations.actions.create.create);

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

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-50 w-full"
        onClick={handleCreateDefaultRepository}
        disabled={isCreating}
      >
        {isCreating ? "Creating Repository..." : "Create Default Repository"}
      </button>

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
    </div>
  );
}
