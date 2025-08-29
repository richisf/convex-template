"use client";

import { useConvexAuth, useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";

export function Page() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  // State for machine creation
  const [isCreatingMachine, setIsCreatingMachine] = useState(false);
  const [machineCreationMessage, setMachineCreationMessage] = useState<string | null>(null);

  // Get default repository
  const defaultRepository = useQuery(api.githubUser.repository.query.getDefaultRepository, {});

  // Action to create machine
  const createMachineAction = useAction(api.githubUser.repository.machine.mutations.actions.create.create);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Function to handle machine creation
  const handleCreateMachine = async () => {
    if (!defaultRepository) {
      setMachineCreationMessage("No default repository found");
      return;
    }

    const repo = defaultRepository;
    setIsCreatingMachine(true);
    setMachineCreationMessage(null);

    try {
      const result = await createMachineAction({ repositoryId: repo._id });

      if (result.success) {
        setMachineCreationMessage(`✅ Machine created successfully! Name: ${result.name}, Zone: ${result.zone}`);
      } else {
        setMachineCreationMessage(`❌ Failed to create machine: ${result.error}`);
      }
    } catch (error) {
      setMachineCreationMessage(`❌ Error creating machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingMachine(false);
    }
  };

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

        <button
          className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreateMachine}
          disabled={isCreatingMachine || !defaultRepository}
        >
          {isCreatingMachine ? "Creating Machine..." : "Create Machine for Default Repo"}
        </button>

        {machineCreationMessage && (
          <div className="text-center p-4 rounded-md bg-slate-100 dark:bg-slate-800 max-w-md">
            <p className="text-sm">{machineCreationMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
