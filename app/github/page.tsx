"use client";

import { Github } from "@/components/pages/github/component";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function DebugParams() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    console.log('=== SERVER SIDE DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Search params from useSearchParams:', Object.fromEntries(searchParams.entries()));
    console.log('Manual URL parse:', new URL(window.location.href).searchParams.toString());
    console.log('========================');
  }, [searchParams]);
  
  return null;
}

export default function GithubPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DebugParams />
      </Suspense>
      <Github />
    </>
  );
}