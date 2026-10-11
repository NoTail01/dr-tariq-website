"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Article } from "@/lib/article-types";

type Session = { enabled: boolean; authenticated: boolean; mode: string };

export default function AdminOverviewPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/session", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/articles", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("unavailable")),
      ),
    ])
      .then(([sessionData, articlesData]) => {
        setSession(sessionData);
        setArticles(articlesData.articles ?? []);
      })
      .catch(() => setError("Article data is unavailable. Check that you are signed in."));
  }, []);

  const published = articles?.filter((a) => a.status === "published").length ?? 0;
  const drafts = articles?.filter((a) => a.status === "draft").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, preview and publish articles in Arabic and English.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Articles", value: articles ? articles.length : "—" },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-navy-900">{card.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-navy-900">Environment</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            Mode:{" "}
            <strong>
              {session?.mode === "development"
                ? "local development (open dashboard)"
                : "production (token protected)"}
            </strong>
          </li>
          <li>
            Dashboard enabled: <strong>{session?.enabled ? "yes" : "no"}</strong>
          </li>
          <li>
            Backend: <strong>file-based (content/articles.json)</strong> — Supabase not
            connected yet, see <code>docs/SUPABASE.md</code>
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/articles/new"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New article
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Site settings
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-bold">Content rules</p>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>Only publish facts that can be traced to a source (see src/content/SOURCES.md).</li>
          <li>Never add qualifications, services, or contact details that were not verified.</li>
          <li>Demo articles are marked and hidden from production automatically.</li>
        </ul>
      </div>
    </div>
  );
}
