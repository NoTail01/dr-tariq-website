"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiGet, apiSend } from "@/components/admin/api";
import type { Article } from "@/lib/article-types";

type ListResponse = { ok: boolean; articles: Article[] };

function Badge({ tone, children }: { tone: "green" | "amber" | "slate"; children: React.ReactNode }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiGet<ListResponse>("/api/admin/articles");
      setArticles(data.articles);
      setError(null);
    } catch {
      setError("Could not load articles. Check your access rights.");
      setArticles([]);
    }
  }

  useEffect(() => {
    // Initial load on mount — state updates happen only after the awaited
    // request resolves, never synchronously inside the effect body.
    const run = async () => {
      try {
        const data = await apiGet<ListResponse>("/api/admin/articles");
        setArticles(data.articles);
        setError(null);
      } catch {
        setError("Could not load articles. Check your access rights.");
        setArticles([]);
      }
    };
    void run();
  }, []);

  async function toggleStatus(article: Article) {
    setBusyId(article.id);
    try {
      await apiSend("PATCH", `/api/admin/articles/${article.id}`, {
        status: article.status === "published" ? "draft" : "published",
      });
      await load();
    } catch {
      setError("Could not update the article status.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(article: Article) {
    const confirmed = window.confirm(
      `Delete "${article.title.en || article.title.ar}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusyId(article.id);
    try {
      await apiSend("DELETE", `/api/admin/articles/${article.id}`);
      await load();
    } catch {
      setError("Could not delete the article.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Articles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drafts are private; demo articles are hidden from production automatically.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New article
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {articles === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-navy-900">No articles yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create the first article to see it appear in the blog.
          </p>
          <Link
            href="/admin/articles/new"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New article
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-start text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-start">Title</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-start">Category</th>
                <th className="px-4 py-3 text-start">Updated</th>
                <th className="px-4 py-3 text-start">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => (
                <tr key={article.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-900">
                      {article.title.en || article.title.ar || "(untitled)"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500" dir="rtl">
                      {article.title.ar || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={article.status === "published" ? "green" : "amber"}>
                        {article.status}
                      </Badge>
                      {article.isDemo ? <Badge tone="slate">demo</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{article.category}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {article.updatedAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/preview/${article.id}`}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Preview
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === article.id}
                        onClick={() => toggleStatus(article)}
                        className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                      >
                        {article.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === article.id}
                        onClick={() => remove(article)}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
