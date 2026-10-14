"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiSend } from "@/components/admin/api";
import { useDashboardLocale } from "@/components/admin/useDashboardLocale";
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
  type Localized,
  type ReviewStatus,
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
  reviewStatus: ReviewStatus;
  reviewNotes: string;
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
    reviewStatus: article?.review.status ?? "pending",
    reviewNotes: article?.review.notes ?? "",
  };
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

export default function ArticleEditor({ article }: Props) {
  const router = useRouter();
  const { t } = useDashboardLocale();
  const [form, setForm] = useState<FormState>(() => toFormState(article));
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Warn before losing unsaved edits.
  const dirty = JSON.stringify(form) !== JSON.stringify(toFormState(article));
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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
        setNotice({ kind: "error", text: body?.message ?? t.common.saveFailed });
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
        localErrors[`slug.${key}`] = t.editor.slugInvalid;
      }
      if (!form.title[key].trim()) {
        localErrors[`title.${key}`] =
          key === "ar" ? t.editor.titleRequiredAr : t.editor.titleRequiredEn;
      }
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setSaving(false);
      setNotice({ kind: "error", text: t.editor.saveFailed });
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
      reviewStatus: form.reviewStatus,
      reviewNotes: form.reviewNotes,
      // `reviewedAt` is deliberately NOT sent: the review timestamp is set
      // by the server when the review decision changes, so the browser can
      // never back-date or fake an approval.
      publishedAt: article?.publishedAt ?? null,
      coverImage: form.coverUrl
        ? { url: form.coverUrl, alt: { ar: form.coverAlt.ar, en: form.coverAlt.en } }
        : null,
    };

    try {
      if (article) {
        await apiSend("PATCH", `/api/admin/articles/${article.id}`, payload);
        setNotice({
          kind: "success",
          text: form.status === "published" ? t.editor.published : t.editor.saved,
        });
        router.refresh();
      } else {
        const created = (await apiSend<{ article: Article }>(
          "POST",
          "/api/admin/articles",
          payload,
        )) as { article: Article };
        setNotice({ kind: "success", text: t.editor.saved });
        router.replace(`/admin/articles/${created.article.id}`);
        router.refresh();
      }
    } catch (error) {
      const apiError = error as { errors?: Record<string, string>; status?: number };
      if (apiError.errors) setErrors(apiError.errors);
      setNotice({
        kind: "error",
        text: apiError.status === 401 ? t.editor.unsaved : t.editor.saveFailed,
      });
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
    { key: "ar", label: t.common.arabic, dir: "rtl" },
    { key: "en", label: t.common.english, dir: "ltr" },
  ];

  const categoryLabels: Record<ArticleCategory, string> = {
    demo: t.articles.colCategory, // replaced below with blog categories
    guides: t.articles.colCategory,
    news: t.articles.colCategory,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">
          {article ? t.editor.editTitle : t.editor.newTitle}
        </h1>
        {dirty ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            ⚠ {t.editor.unsaved}
          </span>
        ) : null}
      </div>

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
                {locale === "ar" ? t.editor.titleAr : t.editor.titleEn}
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
                {locale === "ar" ? t.editor.slugAr : t.editor.slugEn}
              </label>
              <input
                id="slug"
                className={inputClass}
                dir="ltr"
                placeholder="my-article-slug"
                value={form.slug[locale]}
                onChange={(e) => setLocalized("slug", locale, e.target.value.toLowerCase())}
              />
              <p className="mt-1 text-xs text-slate-500">{t.editor.slugInvalid}</p>
              {err(`slug.${locale}`)}
            </div>

            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="excerpt">
                {locale === "ar" ? t.editor.excerptAr : t.editor.excerptEn}
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
                {locale === "ar" ? t.editor.bodyAr : t.editor.bodyEn}
              </label>
              <textarea
                id="body"
                rows={14}
                className={`${inputClass} font-mono text-[13px]`}
                value={form.body[locale]}
                onChange={(e) => setLocalized("body", locale, e.target.value)}
              />
              {err(`body.${locale}`)}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">
                SEO ({locale.toUpperCase()})
              </p>
              <div className="mt-3">
                <label className="text-sm font-semibold text-navy-900" htmlFor="seo-title">
                  {t.editor.seoTitle}
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
                  {t.editor.seoDescription}
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
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">
              {t.editor.status}
            </p>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="status">
                {t.editor.status}
              </label>
              <select
                id="status"
                className={inputClass}
                value={form.status}
                onChange={(e) => {
                  // Publication and medical review are independent states:
                  // publishing never implies that the doctor approved the
                  // article, so no approval is required to go live.
                  setForm((c) => ({ ...c, status: e.target.value as FormState["status"] }));
                }}
              >
                <option value="draft">{t.articles.statusDraft}</option>
                <option value="published">{t.articles.statusPublished}</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500">{t.editor.publishIndependent}</p>
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="category">
                {t.editor.category}
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
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#0b74c9]"
                checked={form.isDemo}
                onChange={(e) => setForm((c) => ({ ...c, isDemo: e.target.checked }))}
              />
              <span>{t.editor.demo}</span>
            </label>

            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="source">
                {t.editor.sourceUrl}
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

          {/* ---------------- Medical review ---------------- */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
            <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">
              {t.editor.reviewSection}
            </p>
            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="review-status">
                {t.editor.reviewStatus}
              </label>
              <select
                id="review-status"
                className={inputClass}
                value={form.reviewStatus}
                onChange={(e) =>
                  setForm((c) => ({ ...c, reviewStatus: e.target.value as ReviewStatus }))
                }
              >
                <option value="pending">{t.editor.reviewPending}</option>
                <option value="approved">{t.editor.reviewApproved}</option>
                <option value="needs-changes">{t.editor.reviewNeedsChanges}</option>
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {form.reviewStatus === "approved"
                  ? t.editor.reviewApproved
                  : t.editor.reviewIndependent}
              </p>
            </div>
            <div className="mt-4">
              <label className="text-sm font-semibold text-navy-900" htmlFor="review-notes">
                {t.editor.reviewNotes}
              </label>
              <textarea
                id="review-notes"
                rows={3}
                className={`${inputClass} resize-y`}
                value={form.reviewNotes}
                onChange={(e) => setForm((c) => ({ ...c, reviewNotes: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">
              {t.editor.authorAr} / {t.editor.authorEn}
            </p>
            <div className="mt-3">
              <label className="text-sm font-semibold text-navy-900" htmlFor="author-ar">
                {t.editor.authorAr}
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
                {t.editor.authorEn}
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
            <p className="text-xs font-bold tracking-wide text-slate-600 uppercase">
              {t.editor.coverImage}
            </p>

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
                  —
                </div>
              )}
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                {uploading ? t.common.saving : t.editor.upload}
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
                {t.editor.imageUrl}
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
                {t.editor.altAr}
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
                {t.editor.altEn}
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
            notice.kind === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving
            ? t.common.saving
            : article
              ? t.common.save
              : t.editor.saveDraft}
        </button>

        {article ? (
          <a
            href={`/admin/preview/${article.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t.editor.previewNewTab}
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (dirty && !window.confirm(t.editor.discardConfirm)) return;
            router.push("/admin/articles");
          }}
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
