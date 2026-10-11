"use client";

import ArticleEditor from "@/components/admin/ArticleEditor";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New article</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in both languages. Nothing is visible to visitors until you publish.
        </p>
      </div>
      <ArticleEditor />
    </div>
  );
}
