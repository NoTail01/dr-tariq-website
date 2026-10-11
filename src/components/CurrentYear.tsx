"use client";

import { useEffect, useRef } from "react";

/**
 * Footer copyright year.
 *
 * The server renders the year captured when the module loaded (build or
 * server start); after hydration the browser replaces it with the visitor's
 * current year. Reading `new Date()` during the prerendered shell is not
 * allowed, and the value is written straight to the DOM so no re-render
 * cascade is triggered.
 */
export default function CurrentYear({ fallback }: { fallback: number }) {
  const ref = useRef<HTMLTimeElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.textContent = String(new Date().getFullYear());
  }, []);

  return <time ref={ref}>{fallback}</time>;
}
