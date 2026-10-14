"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiGet, apiSend } from "@/components/admin/api";
import { useDashboardLocale } from "@/components/admin/useDashboardLocale";
import type { Article, ReviewStatus } from "@/lib/article-types";

type ListResponse = { ok: boolean; articles: Article[] };

type FilterKey = "all" | "drafts" | "review" | "published";

function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "slate" | "blue";
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-brand-100 text-brand-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

const reviewTone: Record<ReviewStatus, "amber" | "green" | "slate"> = {
  pending: "amber",
  approved: "green",
  "needs-changes": "slate",
};

export default function AdminArticlesPage() {
  const { t, locale } = useDashboardLocale();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Initial load on mount — state updates happen only after the awaited
    // request resolves, never synchronously inside the effect body.
    const run = async () => {
      try {
        const data = await apiGet<ListResponse>("/api/admin/articles");
        setArticles(data.articles);
        setError(null);
      } catch {
        setError(t.common.unavailable);
        setArticles([]);
      }
    };
    void run();
  }, [t]);

  async function load() {
    try {
      const data = await apiGet<ListResponse>("/api/admin/articles");
      setArticles(data.articles);
      setError(null);
    } catch {
      setError(t.common.unavailable);
      setArticles([]);
    }
  }

  async function patchArticle(article: Article, patch: Record<string, unknown>) {
    setBusyId(article.id);
    setNotice(null);
    try {
      await apiSend("PATCH", `/api/admin/articles/${article.id}`, patch);
      await load();
    } catch {
      setError(t.common.saveFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublish(article: Article) {
    // Publishing is independent of the medical review: going live never
    // marks the article as doctor-approved.
    await patchArticle(article, {
      status: article.status === "published" ? "draft" : "published",
    });
  }

  async function setReview(article: Article, status: ReviewStatus) {
    // Only the review decision is sent; the server stamps the decision time.
    await patchArticle(article, { reviewStatus: status });
    setNotice(status === "approved" ? t.articles.reviewApproved : t.articles.reviewNeedsChanges);
  }

  async function remove(article: Article) {
    const name = article.title[locale] || article.title.ar || article.title.en || "—";
    const confirmed = window.confirm(
      locale === "ar" ? `حذف "${name}" نهائياً؟` : `Delete "${name}" permanently?`,
    );
    if (!confirmed) return;

    setBusyId(article.id);
    try {
      await apiSend("DELETE", `/api/admin/articles/${article.id}`);
      await load();
    } catch {
      setError(t.common.saveFailed);
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const list = articles ?? [];
    return {
      all: list.length,
      drafts: list.filter((a) => a.status === "draft").length,
      review: list.filter((a) => a.review.status !== "approved").length,
      published: list.filter((a) => a.status === "published").length,
    };
  }, [articles]);

  const visible = useMemo(() => {
    let list = articles ?? [];
    if (filter === "drafts") list = list.filter((a) => a.status === "draft");
    if (filter === "published") list = list.filter((a) => a.status === "published");
    if (filter === "review") list = list.filter((a) => a.review.status !== "approved");
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        [a.title.ar, a.title.en, a.slug.ar, a.slug.en]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [articles, filter, query]);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: t.articles.filterAll, count: counts.all },
    { key: "drafts", label: t.articles.filterDrafts, count: counts.drafts },
    { key: "review", label: t.articles.filterReview, count: counts.review },
    { key: "published", label: t.articles.filterPublished, count: counts.published },
  ];

  // Approve / request-changes control, shared by the card and table layouts.
  const reviewAction = (article: Article) =>
    article.review.status !== "approved" ? (
      <button
        type="button"
        disabled={busyId === article.id}
        onClick={() => setReview(article, "approved")}
        className="rounded-lg border border-green-300 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
      >
        ✓ {t.articles.approve}
      </button>
    ) : (
      <button
        type="button"
        disabled={busyId === article.id}
        onClick={() => setReview(article, "needs-changes")}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
      >
        {t.articles.requestChanges}
      </button>
    );

  // Edit / preview / publish / delete controls, shared by both layouts.
  const rowActions = (article: Article) => (
    <>
      <Link
        href={`/admin/articles/${article.id}`}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
      >
        {t.common.edit}
      </Link>
      <Link
        href={`/admin/preview/${article.id}`}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
      >
        {t.common.preview}
      </Link>
      <button
        type="button"
        disabled={busyId === article.id}
        onClick={() => togglePublish(article)}
        title={article.status === "draft" ? t.articles.publishHint : t.articles.unpublishHint}
        className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
      >
        {article.status === "published" ? t.editor.unpublish : t.editor.publish}
      </button>
      <button
        type="button"
        disabled={busyId === article.id}
        onClick={() => remove(article)}
        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {t.common.delete}
      </button>
    </>
  );

  // Search / filter feedback: say plainly when a query hides everything.
  const filteredEmpty = (articles?.length ?? 0) > 0 && visible.length === 0;
  const emptyTitle = filteredEmpty ? t.articles.noMatches : t.articles.empty;
  const emptyText = filteredEmpty ? t.articles.noMatchesHint : t.articles.emptyHint;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t.articles.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.articles.subtitle}</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t.articles.newArticle}
        </Link>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.articles.filterAll}>
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === item.key
                  ? "bg-navy-900 text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
              <span className="ms-1.5 text-xs opacity-70">{item.count}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.articles.search}
          aria-label={t.articles.search}
          className="min-w-56 flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800"
        >
          ✓ {notice}
        </p>
      ) : null}

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
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-navy-900">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{emptyText}</p>
          <Link
            href="/admin/articles/new"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t.articles.newArticle}
          </Link>
        </div>
      ) : (
        <>
          {/* Phones: one card per article, no horizontal scrolling. */}
          <ul className="space-y-3 lg:hidden">
            {visible.map((article) => (
              <li key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-navy-900 break-words-safe">
                  {article.title[locale] || article.title.ar || article.title.en || "—"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 break-words-safe" dir="rtl">
                  {article.title.ar || "—"}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={article.status === "published" ? "green" : "amber"}>
                    {article.status === "published"
                      ? t.articles.statusPublished
                      : t.articles.statusDraft}
                  </Badge>
                  {article.isDemo ? <Badge tone="slate">demo</Badge> : null}
                  <Badge tone={reviewTone[article.review.status]}>
                    {article.review.status === "approved"
                      ? t.articles.reviewApproved
                      : article.review.status === "needs-changes"
                        ? t.articles.reviewNeedsChanges
                        : t.articles.reviewPending}
                  </Badge>
                </div>

                {article.review.notes ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 break-words-safe">
                    {t.articles.reviewNote}: {article.review.notes}
                  </p>
                ) : null}

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <dt className="font-semibold text-slate-600">{t.articles.colCategory}</dt>
                    <dd>{article.category}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">{t.articles.colUpdated}</dt>
                    <dd>{article.updatedAt.slice(0, 10)}</dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-slate-100 pt-3">{reviewAction(article)}</div>
                <div className="mt-2 flex flex-wrap gap-2">{rowActions(article)}</div>
              </li>
            ))}
          </ul>

          {/* Desktop: a compact table with one row per article. */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[860px] text-start text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-start text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-start">{t.articles.colTitle}</th>
                <th className="px-4 py-3 text-start">{t.articles.colStatus}</th>
                <th className="px-4 py-3 text-start">{t.articles.colCategory}</th>
                <th className="px-4 py-3 text-start">{t.articles.colReview}</th>
                <th className="px-4 py-3 text-start">{t.articles.colUpdated}</th>
                <th className="px-4 py-3 text-start">{t.articles.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((article) => (
                <tr key={article.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-900">
                      {article.title[locale] || article.title.ar || article.title.en || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500" dir="rtl">
                      {article.title.ar || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={article.status === "published" ? "green" : "amber"}>
                        {article.status === "published"
                          ? t.articles.statusPublished
                          : t.articles.statusDraft}
                      </Badge>
                      {article.isDemo ? <Badge tone="slate">demo</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{article.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={reviewTone[article.review.status]}>
                        {article.review.status === "approved"
                          ? t.articles.reviewApproved
                          : article.review.status === "needs-changes"
                            ? t.articles.reviewNeedsChanges
                            : t.articles.reviewPending}
                      </Badge>
                      {reviewAction(article)}
                    </div>
                    {article.review.notes ? (
                      <p className="mt-1 max-w-48 text-xs text-slate-500 break-words-safe">
                        {article.review.notes}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{article.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">{rowActions(article)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
