import Link from "next/link";

import { localizePath, type Locale } from "@/i18n/config";
import type { Article, ArticleCategory } from "@/lib/article-types";
import { DevBadge } from "@/components/PlaceholderImage";

export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function categoryLabel(category: ArticleCategory, labels: { demo: string; guides: string; news: string }) {
  return labels[category];
}

export function readingMinutes(article: Article, locale: Locale): number {
  const words = `${article.title[locale]} ${article.body[locale]}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Localised reading-time label ("1 دقيقة قراءة" / "3 min read"). */
export function readingTimeText(article: Article, locale: Locale): string {
  const minutes = readingMinutes(article, locale);
  if (locale === "ar") {
    const digits = new Intl.NumberFormat("ar-EG").format(minutes);
    return minutes === 1 ? "دقيقة قراءة" : `${digits} دقائق قراءة`;
  }
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

type Props = {
  article: Article;
  locale: Locale;
  labels: {
    readMore: string;
    publishedOn: string;
    byAuthor: string;
    demoBadge: string;
    demoArticleBadge: string;
    notInLanguage: string;
    readInArabic: string;
    readInEnglish: string;
    category: { demo: string; guides: string; news: string };
  };
};

export default function ArticleCard({ article, locale, labels }: Props) {
  const slug = article.slug[locale];
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";
  const otherSlug = article.slug[otherLocale];

  // Bilingual fallback: never emit a broken link. When this locale has no
  // slug, the card explains the gap and links to the available language
  // instead of silently showing the wrong language.
  if (!slug) {
    return (
      <article className="flex h-full flex-col rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            {categoryLabel(article.category, labels.category)}
          </span>
          {article.isDemo ? <DevBadge label={labels.demoBadge} /> : null}
        </div>

        <h3 className="mt-4 text-xl font-bold text-navy-900 break-words-safe">
          {article.title[otherLocale] || labels.notInLanguage}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500 break-words-safe">
          {labels.notInLanguage}
        </p>

        {otherSlug ? (
          <Link
            href={localizePath(otherLocale, `/blog/${otherSlug}`)}
            hrefLang={otherLocale}
            className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
          >
            {otherLocale === "ar" ? labels.readInArabic : labels.readInEnglish}
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </Link>
        ) : null}
      </article>
    );
  }

  const href = localizePath(locale, `/blog/${slug}`);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-6 transition-shadow hover:shadow-[0_10px_40px_-18px_rgba(8,33,63,0.45)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {categoryLabel(article.category, labels.category)}
        </span>
        {article.isDemo ? <DevBadge label={labels.demoBadge} /> : null}
      </div>

      <h3 className="mt-4 text-xl font-bold text-navy-900 break-words-safe">
        <Link href={href} className="transition-colors group-hover:text-brand-700">
          {article.title[locale]}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500 break-words-safe">
        {article.excerpt[locale]}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-brand-100 pt-4 text-xs text-ink-500">
        {article.publishedAt ? (
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
        ) : null}
        <span>{readingTimeText(article, locale)}</span>
        <span className="text-ink-300">
          {labels.byAuthor} {article.author[locale]}
        </span>
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
      >
        {labels.readMore}
        <span aria-hidden="true" className="rtl:rotate-180">→</span>
      </Link>
    </article>
  );
}
