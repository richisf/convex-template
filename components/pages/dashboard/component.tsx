"use client";

import { CreateRepository } from "./createRepository/component";
import { SignOut } from "./singout/component";

export function Dashboard() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="flex flex-col items-center gap-8">
        <CreateRepository />
        <SignOut />
      </div>
    </div>
  );
}
