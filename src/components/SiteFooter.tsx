import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  brandName: string;
  linksTitle: string;
  links: { href: string; label: string }[];
  developedNote: string;
  contactTitle: string;
  contactText: string;
  disclaimerTitle: string;
  disclaimer: string;
  rights: string;
  /** Rendered as a node so the footer can show a client-updated current year. */
  year: ReactNode;
};

export default function SiteFooter({
  brandName,
  linksTitle,
  links,
  developedNote,
  contactTitle,
  contactText,
  disclaimerTitle,
  disclaimer,
  rights,
  year,
}: Props) {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-navy-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold break-words-safe text-white">{brandName}</p>
          <p className="mt-3 text-sm leading-relaxed text-brand-100/80">{developedNote}</p>
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
          <p className="mt-4 text-sm text-brand-100/80">{contactText}</p>

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
