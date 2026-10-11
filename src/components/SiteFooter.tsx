import type { ReactNode } from "react";
import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

type Props = {
  brandName: string;
  /** Professional title shown next to the emblem (already localized). */
  brandTitle: string;
  /** Transparent emblem for the dark footer background. */
  logoSrcDark: string;
  logoAlt: string;
  linksTitle: string;
  links: { href: string; label: string }[];
  developedNote: string;
  contactTitle: string;
  /** Localized address line (or null). */
  address: string | null;
  /** Localized phone line (or null). */
  phoneLine: string | null;
  /** Localized WhatsApp pending note (or null when unknown). */
  whatsappNote: string | null;
  disclaimerTitle: string;
  disclaimer: string;
  rights: string;
  /** Rendered as a node so the footer can show a client-updated current year. */
  year: ReactNode;
};

export default function SiteFooter({
  brandName,
  brandTitle,
  logoSrcDark,
  logoAlt,
  linksTitle,
  links,
  developedNote,
  contactTitle,
  address,
  phoneLine,
  whatsappNote,
  disclaimerTitle,
  disclaimer,
  rights,
  year,
}: Props) {
  return (
    <footer className="mt-auto border-t border-brand-500/30 bg-navy-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <BrandLogo
            name={brandName}
            title={brandTitle}
            emblemSrc={logoSrcDark}
            emblemAlt={logoAlt}
            tone="light"
          />
          <p className="mt-4 text-sm leading-relaxed text-brand-100/80 break-words-safe">
            {developedNote}
          </p>
        </div>

        <nav aria-label={linksTitle}>
          <p className="text-sm font-bold tracking-wide text-white uppercase">{linksTitle}</p>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-brand-100/85 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-bold tracking-wide text-white uppercase">{contactTitle}</p>
          <p className="mt-4 text-sm text-brand-100/80 break-words-safe">
            {address ?? developedNote}
          </p>
          {phoneLine ? (
            <p className="mt-3 text-sm font-semibold text-white break-words-safe" dir="ltr">
              {phoneLine}
            </p>
          ) : null}
          {whatsappNote ? (
            <p className="mt-2 text-xs text-amber-300/90 break-words-safe">{whatsappNote}</p>
          ) : null}

          <div className="mt-6 rounded-xl border border-amber-400/40 bg-navy-800 p-4">
            <p className="text-xs font-bold tracking-wide text-amber-300 uppercase">
              {disclaimerTitle}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-brand-100/80">{disclaimer}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-500/30 py-5">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs break-words-safe text-brand-100/70 sm:px-6">
          © {year} {brandName} — {rights}
        </p>
      </div>
    </footer>
  );
}
