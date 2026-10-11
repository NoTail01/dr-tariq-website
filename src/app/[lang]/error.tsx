"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Client-side error boundary for the public site.
 * Falls back to English when the locale cannot be resolved.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the digest only — never user data.
    console.error("Route error", error.digest);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-bold tracking-widest text-red-600 uppercase">500</p>
      <h1 className="mt-3 text-3xl font-bold text-navy-900">Something went wrong</h1>
      <p className="mt-4 text-ink-500">
        An unexpected error occurred. Please try again, or return to the home page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/ar"
          className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
