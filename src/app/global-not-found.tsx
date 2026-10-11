import Link from "next/link";

import "./globals.css";
import { plexArabic } from "@/lib/font";

export const metadata = {
  title: "404 | Dr Tariq Abu Hweij",
  description: "The page you are looking for does not exist.",
  robots: { index: false as const },
};

/**
 * Application-wide 404 (enabled through `experimental.globalNotFound`).
 * Needed because the app uses multiple root layouts (public site + admin).
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={`${plexArabic.variable} antialiased`}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center font-sans">
        <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">404</p>
        <h1 className="mt-3 text-3xl font-bold text-navy-900">Page not found</h1>
        <p className="mt-3 max-w-md text-ink-500">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/ar"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            hrefLang="ar"
          >
            العربية
          </Link>
          <Link
            href="/en"
            className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            hrefLang="en"
          >
            English
          </Link>
        </div>
      </body>
    </html>
  );
}
