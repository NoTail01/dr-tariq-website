"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import Markdown from "@/components/Markdown";
import { CloseIcon, WarningIcon } from "@/components/Icons";

import { apiSend } from "@/components/admin/api";
import { setUnsavedChanges } from "@/components/admin/unsaved-guard";
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
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-600";

function cloneFormState(state: FormState): FormState {
  return JSON.parse(JSON.stringify(state)) as FormState;
}

function safePreviewImage(url: string): string | null {
  if (url.startsWith("/uploads/") || /^https:\/\//.test(url)) return url;
  return null;
}

export default function ArticleEditor({ article }: Props) {
  const router = useRouter();
  const { t } = useDashboardLocale();
  const [form, setForm] = useState<FormState>(() => toFormState(article));
  const [baseline, setBaseline] = useState<FormState>(() => toFormState(article));
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewCloseRef = useRef<HTMLButtonElement | null>(null);

  // Warn before losing unsaved edits.
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  useEffect(() => {
    setUnsavedChanges(dirty);
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Clear the shared flag when the editor unmounts after a confirmed navigation.
  useEffect(() => () => setUnsavedChanges(false), []);

  // Local preview is a focus-trapped modal over the current editor state.
  // It never writes to the store, calls an API, or exposes a public URL.
  useEffect(() => {
    if (!previewOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previewCloseRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreviewOpen(false);
        return;
      }
      if (event.key !== "Tab" || !previewRef.current) return;
      const nodes = Array.from(
        previewRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [previewOpen]);

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
        setBaseline(cloneFormState(form));
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
        setBaseline(toFormState(created.article));
        setNotice({ kind: "success", text: t.editor.saved });
        router.replace(`/admin/articles/${created.article.id}`);
        router.refresh();
      }
    } catch (error) {
      const apiError = error as { errors?: Record<string, string>; status?: number };
      if (apiError.errors) setErrors(apiError.errors);
      setNotice({
        kind: "error",
        text: apiError.status === 401 ? t.editor.sessionExpired : t.editor.saveFailed,
      });
    } finally {
      setSaving(false);
    }
  }

  const errorId = (key: string) => `field-error-${key.replace(/[^a-zA-Z0-9]/g, "-")}`;

  const fieldA11y = (key: string) => {
    const invalid = Boolean(errors[key]);
    return {
      "aria-invalid": invalid,
      "aria-describedby": invalid ? errorId(key) : undefined,
    };
  };

  const err = (key: string) =>
    errors[key] ? (
      <p id={errorId(key)} className="mt-1 text-xs font-medium text-red-700" role="alert">
        {errors[key]}
      </p>
    ) : null;

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, key: "ar" | "en") {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = key === "ar" ? "en" : "ar";
    setLocale(next);
    window.requestAnimationFrame(() => document.getElementById(`content-tab-${next}`)?.focus());
  }

  const tabs: { key: "ar" | "en"; label: string; dir: "rtl" | "ltr" }[] = [
    { key: "ar", label: t.common.arabic, dir: "rtl" },
    { key: "en", label: t.common.english, dir: "ltr" },
  ];

  const categoryLabels: Record<ArticleCategory, string> = {
    demo: t.articles.categoryDemo,
    guides: t.articles.categoryGuides,
    news: t.articles.categoryNews,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {article ? t.editor.editTitle : t.editor.newTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {article ? t.editor.editSubtitle : t.editor.newSubtitle}
          </p>
        </div>
        {dirty ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            <WarningIcon className="h-4 w-4" /> {t.editor.unsaved}
          </span>
        ) : null}
      </div>

      {/* Language tabs */}
      <div
        className="flex gap-2"
        role="tablist"
        aria-label={t.editor.contentLanguage}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`content-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={locale === tab.key}
            aria-controls={`content-panel-${tab.key}`}
            tabIndex={locale === tab.key ? 0 : -1}
            onClick={() => setLocale(tab.key)}
            onKeyDown={(event) => onTabKeyDown(event, tab.key)}
            className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold ${
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
          <div
          role="tabpanel"
          id={`content-panel-${locale}`}
          aria-labelledby={`content-tab-${locale}`}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="space-y-5"
        >
            <div>
              <label className="text-sm font-semibold text-navy-900" htmlFor="title">
                {locale === "ar" ? t.editor.titleAr : t.editor.titleEn}
              </label>
              <input
                id="title"
                className={inputClass}
                value={form.title[locale]}
                onChange={(e) => setLocalized("title", locale, e.target.value)}
                {...fieldA11y(`title.${locale}`)}
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
                {...fieldA11y(`slug.${locale}`)}
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
                {...fieldA11y(`excerpt.${locale}`)}
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
                {...fieldA11y(`body.${locale}`)}
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
                  {...fieldA11y(`seo.title.${locale}`)}
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
                  {...fieldA11y(`seo.description.${locale}`)}
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

            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-6 w-6 shrink-0 accent-[#0b74c9]"
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
                {...fieldA11y("sourceUrl")}
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
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
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
                {...fieldA11y("coverImage.alt")}
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
                {...fieldA11y("coverImage.alt")}
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
          className="inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving
            ? t.common.saving
            : article
              ? t.common.save
              : t.editor.saveDraft}
        </button>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex min-h-12 items-center rounded-xl border border-brand-300 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          {t.editor.previewUnsaved}
        </button>

        {article ? (
          <a
            href={`/admin/preview/${article.id}`}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              if (dirty && !window.confirm(t.editor.previewSavedConfirm)) event.preventDefault();
            }}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t.editor.previewNewTab}
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (dirty && !window.confirm(t.editor.discardConfirm)) return;
            setUnsavedChanges(false);
            router.push("/admin/articles");
          }}
          className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {t.common.cancel}
        </button>
      </div>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewOpen(false);
          }}
        >
          <div
            ref={previewRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-preview-title"
            className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                  {t.editor.previewUnsaved}
                </p>
                <h2 id="unsaved-preview-title" className="mt-1 text-xl font-bold text-navy-900 break-words-safe">
                  {form.title.ar || form.title.en || t.editor.untitled}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{t.editor.previewLocalNote}</p>
              </div>
              <button
                ref={previewCloseRef}
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label={t.editor.previewClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {tabs.map((tab) => {
                const cover = safePreviewImage(form.coverUrl);
                return (
                  <section
                    key={tab.key}
                    dir={tab.dir}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                      {tab.label}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-navy-900 break-words-safe">
                      {form.title[tab.key] || t.editor.untitled}
                    </h3>
                    <p className="mt-1 text-sm text-ink-500 break-words-safe">
                      {form.excerpt[tab.key] || "-"}
                    </p>
                    {cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cover} alt="" className="mt-3 max-h-56 w-full rounded-lg object-cover" />
                    ) : null}
                    <div className="article-body mt-4 text-sm text-ink-700">
                      {form.body[tab.key] ? (
                        <Markdown source={form.body[tab.key]} />
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
