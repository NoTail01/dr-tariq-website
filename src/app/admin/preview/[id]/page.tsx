"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiGet } from "@/components/admin/api";
import Markdown from "@/components/Markdown";
import type { Article } from "@/lib/article-types";

/** Draft preview — never linked from the public site and marked noindex. */
export default function PreviewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    apiGet<{ article: Article }>(`/api/admin/articles/${id}`)
      .then((data) => setArticle(data.article))
      .catch(() => setError("Article not found or you are not signed in."));
  }, [id]);

  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  if (!article) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">
            Preview — {article.status}
            {article.isDemo ? " · demo" : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy-900 break-words-safe">
            {article.title.en || article.title.ar || "(untitled)"}
          </h1>
        </div>
        <Link
          href={`/admin/articles/${article.id}`}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to editing
        </Link>
      </div>

      {(["ar", "en"] as const).map((locale) => (
        <section
          key={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            {locale === "ar" ? "العربية" : "English"}
          </p>
          <h2 className="mt-3 text-xl font-bold text-navy-900 break-words-safe">
            {article.title[locale] || "—"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 break-words-safe">{article.excerpt[locale] || "—"}</p>

          {article.coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={article.coverImage.url}
              alt={article.coverImage.alt[locale]}
              className="mt-4 max-h-72 w-full rounded-xl object-cover"
            />
          ) : null}

          <div className="mt-4 text-sm text-slate-700">
            {article.body[locale] ? (
              <Markdown source={article.body[locale]} />
            ) : (
              <p>—</p>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
            <p>
              <strong>SEO title:</strong> {article.seo.title[locale] || "—"}
            </p>
            <p className="mt-1">
              <strong>SEO description:</strong> {article.seo.description[locale] || "—"}
            </p>
            <p className="mt-1" dir="ltr">
              <strong>URL:</strong> /{locale}/blog/{article.slug[locale] || "…"}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
