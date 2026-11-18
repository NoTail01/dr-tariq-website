"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Stagger delay in ms for stacked elements. */
  delay?: number;
  className?: string;
  /**
   * Above-the-fold content: animate from CSS on first paint so it is never
   * hidden waiting for hydration (keeps LCP independent of JavaScript).
   */
  immediate?: boolean;
};

/**
 * Adds a subtle entrance animation the first time an element scrolls into
 * view. Users who prefer reduced motion see the content immediately.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  immediate = false,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Visibility is toggled on the DOM node itself (not React state) so the
  // entrance animation never triggers a re-render cascade.
  useEffect(() => {
    const node = ref.current;
    if (!node || immediate) return;

    const reveal = () => node.classList.add("is-visible");

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={`reveal ${immediate ? "reveal-immediate " : ""}${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
