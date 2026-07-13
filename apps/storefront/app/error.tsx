"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where a reporter (Sentry etc.) would go. The digest
    // is the only safe correlation id — `error.message` is scrubbed by Next on
    // the server precisely so it cannot leak internals to the browser.
    console.error("Unhandled error", error.digest);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-28">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">
          The page failed to load. This has been logged.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-8">
          Try again
        </Button>
      </div>
    </main>
  );
}
