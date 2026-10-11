"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ArticleEditor from "@/components/admin/ArticleEditor";
import { apiGet } from "@/components/admin/api";
import type { Article } from "@/lib/article-types";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
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
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Link href="/admin/articles" className="mt-3 inline-block text-sm font-semibold text-red-800 underline">
          Back to articles
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
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Edit article</h1>
        <p className="mt-1 text-sm text-slate-500 break-words-safe">
          {article.title.en || article.title.ar || "(untitled)"}
        </p>
      </div>
      <ArticleEditor article={article} />
    </div>
  );
}
