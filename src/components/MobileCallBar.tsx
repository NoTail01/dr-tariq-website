"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compact mobile call action for the Book Now page.
 *
 * Only rendered on small screens (`lg:hidden`) where the call buttons sit
 * far down the page. The bar hides itself once the visitor reaches the end
 * of the page content (sentinel element), so it never covers the footer or
 * other content. It is a normal in-flow link — no focus trap.
 */
export default function MobileCallBar({
  href,
  prompt,
  action,
}: {
  /** tel: link to the clinic. */
  href: string;
  /** Short prompt shown beside the button (already localized). */
  prompt: string;
  /** Button label (already localized). */
  action: string;
}) {
  const [visible, setVisible] = useState(true);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    // Hide the bar while the end-of-content sentinel is on screen, so the
    // bar never overlaps the footer or the last section of the page.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-0 w-full" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 p-3 shadow-[0_-8px_24px_-16px_rgba(8,33,63,0.45)] backdrop-blur transition-transform duration-200 lg:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!visible}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-1">
          <span className="text-xs leading-tight font-semibold text-ink-500 break-words-safe">
            {prompt}
          </span>
          <a
            href={href}
            tabIndex={visible ? undefined : -1}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a.75.75 0 0 1-.95.235l-1.942-.777a1.125 1.125 0 0 0-1.297.363l-.724 1.282a1.125 1.125 0 0 1-.32.944C6.36 17.44 3.5 14.5 3.5 10.9V9.75A3 3 0 0 0 .5 6.75Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {action}
          </a>
        </div>
      </div>
    </>
  );
}
