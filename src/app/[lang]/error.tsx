"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-side error boundary for the public site.
 * Uses the URL locale; English is the fallback.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const copy = isArabic
    ? {
        title: "حدث خطأ غير متوقع",
        text: "حدث خطأ غير متوقع. حاول مرة أخرى أو عد إلى الصفحة الرئيسية.",
        retry: "حاول مرة أخرى",
        home: "العودة إلى الرئيسية",
      }
    : {
        title: "Something went wrong",
        text: "An unexpected error occurred. Please try again, or return to the home page.",
        retry: "Try again",
        home: "Go to the home page",
      };

  useEffect(() => {
    // Log the digest only — never user data.
    console.error("Route error", error.digest);
  }, [error]);

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-bold tracking-widest text-red-600 uppercase">500</p>
      <h1 className="mt-3 text-3xl font-bold text-navy-900">{copy.title}</h1>
      <p className="mt-4 text-ink-500">
        {copy.text}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {copy.retry}
        </button>
        <Link
          href={isArabic ? "/ar" : "/en"}
          className="rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          {copy.home}
        </Link>
      </div>
    </div>
  );
}
