import type { Metadata } from "next";
import { Suspense } from "react";

import "../globals.css";

import AdminShell from "@/components/admin/AdminShell";
import { plexArabic } from "@/lib/font";

export const metadata: Metadata = {
  title: "Dashboard | Dr Tariq Abu Hweij",
  description: "Private content dashboard.",
  // The dashboard must never appear in search results.
  robots: { index: false, follow: false },
};

/**
 * The dashboard reads the session and pathname at runtime, so it opts out of
 * instant (prerendered) navigation and renders per request instead.
 */
export const instant = false;

/** Root layout for the private dashboard (separate from the public site). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${plexArabic.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50 font-sans">
        {/* AdminShell reads the pathname at runtime, so it streams behind a
            boundary while the static shell is being prerendered. */}
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
              Loading dashboard…
            </div>
          }
        >
          <AdminShell>{children}</AdminShell>
        </Suspense>
      </body>
    </html>
  );
}
