"use client";

import { useEffect } from "react";
import Link from "next/link";
import { toFriendlyError } from "@/lib/error-copy";

export default function Error({
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
    <div className="min-h-[80vh] w-full px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-500/30 bg-neutral-950/80 p-8 text-white shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Error</p>
        <h1 className="mt-2 text-2xl font-semibold">{friendly.title}</h1>
        <p className="mt-3 text-sm text-neutral-200">{friendly.message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
