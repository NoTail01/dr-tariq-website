"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ArticleEditor from "@/components/admin/ArticleEditor";
import { apiGet } from "@/components/admin/api";
import { useDashboardLocale } from "@/components/admin/useDashboardLocale";
import type { Article } from "@/lib/article-types";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useDashboardLocale();
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
      .catch(() => setError(t.editor.notFound));
  }, [id, t.editor.notFound]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Link href="/admin/articles" className="mt-3 inline-block text-sm font-semibold text-red-800 underline">
          {t.editor.backToArticles}
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 break-words-safe">
        {article.title.en || article.title.ar || t.editor.untitled}
      </p>
      <ArticleEditor article={article} />
    </div>
  );
}
