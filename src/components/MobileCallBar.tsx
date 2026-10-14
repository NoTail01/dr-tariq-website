"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compact mobile contact bar for the appointments page.
 *
 * Only rendered on small screens (`lg:hidden`) where the contact buttons sit
 * far down the page. The bar hides itself once the visitor reaches the end of
 * the page content (sentinel element), so it never covers the footer or other
 * content. Both actions are normal in-flow links — no focus trap.
 *
 * Layout notes:
 *  - the prompt collapses above the buttons instead of squeezing them, and
 *    the buttons shrink before they can overflow a 360px viewport;
 *  - `env(safe-area-inset-bottom)` keeps the bar clear of the home indicator
 *    on notched devices, and the page reserves the same space above;
 *  - while hidden the bar is `inert`, so its links are unreachable by
 *    keyboard and pointer — not merely visually translated away.
 */
export default function MobileCallBar({
  callHref,
  callLabel,
  whatsappHref,
  whatsappLabel,
  prompt,
}: {
  /** tel: link to the clinic. */
  callHref: string;
  /** Localized call button label. */
  callLabel: string;
  /** wa.me link with the prefilled message, or null when WhatsApp is off. */
  whatsappHref: string | null;
  /** Localized WhatsApp button label. */
  whatsappLabel: string;
  /** Short prompt shown above the buttons (already localized). */
  prompt: string;
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
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(8,33,63,0.45)] backdrop-blur transition-transform duration-200 lg:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 pt-2">
          <span className="text-center text-xs leading-tight font-semibold text-ink-500">
            {prompt}
          </span>
          <div className="flex min-w-0 items-center gap-2">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-white px-3 text-sm font-bold text-[#128C7E] transition-colors hover:bg-[#25D366]/10"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 shrink-0"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="truncate">{whatsappLabel}</span>
              </a>
            ) : null}
            <a
              href={callHref}
              className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 shrink-0"
              >
                <path
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a.75.75 0 0 1-.95.235l-1.942-.777a1.125 1.125 0 0 0-1.297.363l-.724 1.282a1.125 1.125 0 0 1-.32.944C6.36 17.44 3.5 14.5 3.5 10.9V9.75A3 3 0 0 0 .5 6.75Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="truncate">{callLabel}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
