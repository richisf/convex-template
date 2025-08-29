"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export function Github() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GithubContent />
    </Suspense>
  );
}

function GithubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  const currentUser = useQuery(api.auth.currentUser);
  const createGithubUser = useAction(api.githubUser.mutations.actions.fetch.fetch);

  useEffect(() => {
    if (processed) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');



    // Handle OAuth errors
    if (errorParam) {
      setError(searchParams.get('error_message') || errorParam);
      setProcessed(true);
      return;
    }

    // Handle success redirect
    if (successParam === 'github_connected') {
      setSuccess('GitHub account successfully connected!');
      setProcessed(true);
      setTimeout(() => router.push('/dashboard'), 2000);
      return;
    }

    // Handle OAuth callback - only process if we have both code and state, and user query is resolved
    if (code && state && currentUser !== undefined) {
      setProcessed(true);
          setIsLoading(true);
          setError(null);

      createGithubUser({
            userId: currentUser?.subject as Id<"users"> | undefined,
            code: code,
      })
      .then((result) => {
          if (!result.success) {
            throw new Error(result.error || 'Failed to connect GitHub account');
          }

          setSuccess('GitHub account successfully connected!');
        setIsLoading(false);
          
        // Clean URL and redirect after success
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.toString());

        setTimeout(() => router.push('/dashboard'), 2000);
      })
      .catch((err) => {
          console.error('OAuth error:', err);
          setError(err instanceof Error ? err.message : 'Failed to connect GitHub account');
          setIsLoading(false);
      });
    }
  }, [searchParams, router, createGithubUser, currentUser, processed]);

  const initiateGithubOAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate random state and OAuth URL
      const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const clientId = 'Ov23liMY9jf9X63IcI2e';
      const callbackUrl = `${window.location.origin}/api/test-oauth`;
      const scope = "repo, user"; // No scopes - minimal test

      const url = `https://github.com/login/oauth/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${encodeURIComponent(state)}`;

      // Redirect to GitHub OAuth
      window.location.href = url;
    } catch (err) {
      console.error('OAuth initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate GitHub OAuth');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        {/* Debug info - visible on page */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
          <div><strong>Debug Info:</strong></div>
          <div>URL: {typeof window !== 'undefined' ? window.location.href : 'loading...'}</div>
          <div>Code: {searchParams.get('code') || 'missing'}</div>
          <div>State: {searchParams.get('state') || 'missing'}</div>
          <div>Error: {searchParams.get('error') || 'none'}</div>
          <div>User: {currentUser === undefined ? 'loading' : currentUser ? 'logged-in' : 'anonymous'}</div>
          <div>Processed: {processed.toString()}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect GitHub</h1>
            <p className="text-gray-600">
              Connect your GitHub account to link your repositories
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">✅ {success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500">
              Link your GitHub repositories to get started with managing your codebase.
            </div>
            
            <button
              onClick={initiateGithubOAuth}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Connect GitHub Account
                </>
              )}
            </button>

            <div className="text-center">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
