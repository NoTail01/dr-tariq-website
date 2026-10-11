"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiSend } from "@/components/admin/api";
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  type Localized,
} from "@/lib/article-types";

type Props = { article?: Article };

type FormState = {
  status: "draft" | "published";
  isDemo: boolean;
  category: ArticleCategory;
  slug: Localized;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  seoTitle: Localized;
  seoDescription: Localized;
  author: Localized;
  sourceUrl: string;
  coverUrl: string;
  coverAlt: Localized;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toFormState(article?: Article): FormState {
  return {
    status: article?.status ?? "draft",
    isDemo: article?.isDemo ?? true,
    category: article?.category ?? "demo",
    slug: article?.slug ?? { ar: "", en: "" },
    title: article?.title ?? { ar: "", en: "" },
    excerpt: article?.excerpt ?? { ar: "", en: "" },
    body: article?.body ?? { ar: "", en: "" },
    seoTitle: article?.seo.title ?? { ar: "", en: "" },
    seoDescription: article?.seo.description ?? { ar: "", en: "" },
    author: article?.author ?? { ar: "", en: "" },
    sourceUrl: article?.sourceUrl ?? "",
    coverUrl: article?.coverImage?.url ?? "",
    coverAlt: article?.coverImage?.alt ?? { ar: "", en: "" },
  };
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

export default function ArticleEditor({ article }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(article));
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const setLocalized = (field: keyof FormState, key: "ar" | "en", value: string) => {
    setForm((current) => ({
      ...current,
      [field]: { ...(current[field] as Localized), [key]: value },
    }));
  };

  async function uploadImage(file: File) {
    setUploading(true);
    setNotice(null);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; url?: string; message?: string }
        | null;

      if (!response.ok || !body?.ok || !body.url) {
        setNotice(body?.message ?? "Image upload failed.");
        return;
      }
      setForm((current) => ({ ...current, coverUrl: body.url as string }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setNotice(null);

    // Fast client-side checks; the server validates again.
    const localErrors: Record<string, string> = {};
    for (const key of ["ar", "en"] as const) {
      if (form.slug[key] && !SLUG_PATTERN.test(form.slug[key])) {
        localErrors[`slug.${key}`] = "Lowercase Latin letters, numbers and hyphens only.";
      }
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setSaving(false);
      return;
    }

    const payload = {
      status: form.status,
      isDemo: form.isDemo,
      category: form.category,
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      seo: { title: form.seoTitle, description: form.seoDescription },
      author: form.author,
      sourceUrl: form.sourceUrl || null,
      publishedAt: article?.publishedAt ?? null,
      coverImage: form.coverUrl
        ? { url: form.coverUrl, alt: { ar: form.coverAlt.ar, en: form.coverAlt.en } }
        : null,
    };

    try {
      if (article) {
        await apiSend("PATCH", `/api/admin/articles/${article.id}`, payload);
        setNotice("Saved.");
        router.refresh();
      } else {
        const created = (await apiSend<{ article: Article }>(
          "POST",
          "/api/admin/articles",
          payload,
        )) as { article: Article };
        router.replace(`/admin/articles/${created.article.id}`);
        router.refresh();
      }
    } catch (error) {
      const apiError = error as { errors?: Record<string, string>; status?: number };
      if (apiError.errors) setErrors(apiError.errors);
      setNotice(
        apiError.status === 401
          ? "Your session expired. Sign in again."
          : "Could not save the article.",
      );
    } finally {
      setSaving(false);
    }
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs font-medium text-red-600" role="alert">
        {errors[key]}
      </p>
    ) : null;

  const tabs: { key: "ar" | "en"; label: string; dir: "rtl" | "ltr" }[] = [
    { key: "ar", label: "العربية", dir: "rtl" },
    { key: "en", label: "English", dir: "ltr" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Language tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Content language">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={locale === tab.key}
            onClick={() => setLocale(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              locale === tab.key
                ? "bg-navy-900 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* ---------------- Content ---------------- */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="title">
                Title ({locale.toUpperCase()})
              </label>
              <input
                id="title"
                className={inputClass}
                value={form.title[locale]}
                onChange={(e) => setLocalized("title", locale, e.target.value)}
              />
              {err(`title.${locale}`)}
            </div>

            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="slug">
                Slug ({locale.toUpperCase()})
              </label>
              <input
                id="slug"
                className={inputClass}
                dir="ltr"
                placeholder="my-article-slug"
                value={form.slug[locale]}
                onChange={(e) => setLocalized("slug", locale, e.target.value.toLowerCase())}
              />
              <p className="mt-1 text-xs text-slate-500">
                Latin characters only, e.g. <code>healthy-habits</code>
              </p>
              {err(`slug.${locale}`)}
            </div>

            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="excerpt">
                Excerpt ({locale.toUpperCase()})
              </label>
              <textarea
                id="excerpt"
                rows={3}
                className={inputClass}
                value={form.excerpt[locale]}
                onChange={(e) => setLocalized("excerpt", locale, e.target.value)}
              />
              {err(`excerpt.${locale}`)}
            </div>

            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="body">
                Body ({locale.toUpperCase()}) — Markdown-lite
              </label>
              <textarea
                id="body"
                rows={14}
                className={`${inputClass} font-mono text-[13px]`}
                value={form.body[locale]}
                onChange={(e) => setLocalized("body", locale, e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Separate paragraphs with an empty line, headings with <code>##</code>, lists
                with <code>-</code>.
              </p>
              {err(`body.${locale}`)}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">
                SEO ({locale.toUpperCase()})
              </p>
              <div className="mt-3">
                <label className="text-sm font-semibold text-navy-900" htmlFor="seo-title">
                  SEO title
                </label>
                <input
                  id="seo-title"
                  className={inputClass}
                  maxLength={70}
                  value={form.seoTitle[locale]}
                  onChange={(e) => setLocalized("seoTitle", locale, e.target.value)}
                />
                {err(`seo.title.${locale}`)}
              </div>
              <div className="mt-3">
                <label className="text-sm font-semibold text-navy-900" htmlFor="seo-desc">
                  SEO description
                </label>
                <textarea
                  id="seo-desc"
                  rows={2}
                  className={inputClass}
                  maxLength={170}
                  value={form.seoDescription[locale]}
                  onChange={(e) => setLocalized("seoDescription", locale, e.target.value)}
                />
                {err(`seo.description.${locale}`)}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Settings ---------------- */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">Publishing</p>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as FormState["status"] }))
                }
              >
                <option value="draft">Draft (private)</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm((c) => ({ ...c, category: e.target.value as ArticleCategory }))
                }
              >
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#1767c4]"
                checked={form.isDemo}
                onChange={(e) => setForm((c) => ({ ...c, isDemo: e.target.checked }))}
              />
              <span>
                <strong>Demo/template article.</strong> Marked on the page, excluded from the
                sitemap, and hidden in production.
              </span>
            </label>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="source">
                Source URL (optional)
              </label>
              <input
                id="source"
                dir="ltr"
                className={inputClass}
                placeholder="https://…"
                value={form.sourceUrl}
                onChange={(e) => setForm((c) => ({ ...c, sourceUrl: e.target.value }))}
              />
              {err("sourceUrl")}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">Author</p>
            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="author-ar">
                Author (AR)
              </label>
              <input
                id="author-ar"
                dir="rtl"
                className={inputClass}
                value={form.author.ar}
                onChange={(e) => setLocalized("author", "ar", e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="author-en">
                Author (EN)
              </label>
              <input
                id="author-en"
                dir="ltr"
                className={inputClass}
                value={form.author.en}
                onChange={(e) => setLocalized("author", "en", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">Cover image</p>

            <div className="mt-3 flex items-center gap-3">
              {form.coverUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={form.coverUrl}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                  none
                </div>
              )}
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
              </label>
            </div>

            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="cover-url">
                Image URL
              </label>
              <input
                id="cover-url"
                dir="ltr"
                className={inputClass}
                placeholder="/uploads/…"
                value={form.coverUrl}
                onChange={(e) => setForm((c) => ({ ...c, coverUrl: e.target.value }))}
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="cover-alt-ar">
                Alt text (AR)
              </label>
              <input
                id="cover-alt-ar"
                dir="rtl"
                className={inputClass}
                value={form.coverAlt.ar}
                onChange={(e) => setLocalized("coverAlt", "ar", e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="cover-alt-en">
                Alt text (EN)
              </label>
              <input
                id="cover-alt-en"
                dir="ltr"
                className={inputClass}
                value={form.coverAlt.en}
                onChange={(e) => setLocalized("coverAlt", "en", e.target.value)}
              />
              {err("coverImage.alt")}
            </div>
          </div>
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className={`rounded-xl p-4 text-sm font-medium ${
            notice === "Saved."
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : article ? "Save changes" : "Create article"}
        </button>

        {article ? (
          <a
            href={`/admin/preview/${article.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Preview in new tab
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
