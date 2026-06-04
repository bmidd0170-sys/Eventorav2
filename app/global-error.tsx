"use client";

import { useEffect } from "react";
import { toFriendlyError } from "@/lib/error-copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const friendly = toFriendlyError(error);

  return (
    <html>
      <body className="min-h-screen bg-black px-6 py-16 text-white">
        <main className="mx-auto max-w-2xl rounded-3xl border border-rose-500/30 bg-neutral-950 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-300">
            Critical Error
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{friendly.title}</h1>
          <p className="mt-3 text-sm text-neutral-200">{friendly.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Reload app
          </button>
        </main>
      </body>
    </html>
  );
}
