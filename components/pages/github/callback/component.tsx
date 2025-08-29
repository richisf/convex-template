"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DefaultRepositoryCreator } from "./default/component";

export function GithubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  const currentUser = useQuery(api.auth.currentUser);
  const createGithubUser = useAction(api.githubUser.mutations.actions.create.create);

  useEffect(() => {
    if (processed) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle OAuth errors
    if (errorParam) {
      setError(searchParams.get('error_message') || errorParam);
      setProcessed(true);
      return;
    }

    // Handle OAuth callback
    if (code && state && currentUser !== undefined) {
      setProcessed(true);
      setLoading(true);

      createGithubUser({
        userId: currentUser?.subject as Id<"users"> | undefined,
        code,
      })
        .then((result) => {
          if (!result.success) throw new Error(result.error || 'Failed to connect GitHub account');

          setSuccess('GitHub account successfully connected!');
          setLoading(false);

          // Clean URL and redirect
          const url = new URL(window.location.href);
          ['code', 'state'].forEach(param => url.searchParams.delete(param));
          window.history.replaceState({}, '', url.toString());
          setTimeout(() => router.push('/dashboard'), 2000);
        })
        .catch((err) => {
          console.error('OAuth error:', err);
          setError(err instanceof Error ? err.message : 'Failed to connect GitHub account');
          setLoading(false);
        });
    }
  }, [searchParams, router, createGithubUser, currentUser, processed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting your GitHub account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/github')}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="text-green-500 mb-2">✅</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">GitHub Connected!</h2>
            <p className="text-sm text-gray-600">{success}</p>
          </div>

          {!currentUser && <DefaultRepositoryCreator />}

          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
