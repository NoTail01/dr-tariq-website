import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ArticleCard from "@/components/ArticleCard";
import { DevBadge } from "@/components/PlaceholderImage";
import { EmptyState, Section, SectionHeading } from "@/components/Layout";
import Reveal from "@/components/Reveal";
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from "@/lib/article-types";
import { getVisibleArticles } from "@/lib/articles";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, locales, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { getSiteMode } from "@/lib/site";

/** Both locales are known at build time so the page is prerendered. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return pageMetadata({
    locale: lang,
    path: "/blog",
    title: dict.meta.seo.blog.title,
    description: dict.meta.seo.blog.description,
  });
}

type ListLabels = {
  readMore: string;
  publishedOn: string;
  byAuthor: string;
  demoBadge: string;
  demoArticleBadge: string;
  category: { demo: string; guides: string; news: string };
};

function CategoryChips({
  locale,
  active,
  allLabel,
  navLabel,
  labels,
  counts,
}: {
  locale: Locale;
  active: string | null;
  allLabel: string;
  navLabel: string;
  labels: { demo: string; guides: string; news: string };
  counts: Record<ArticleCategory, number>;
}) {
  const hrefFor = (category: ArticleCategory | null) =>
    `${localizePath(locale, "/blog")}${category ? `?category=${category}` : ""}`;

  return (
    <nav aria-label={navLabel} className="mt-8 flex flex-wrap gap-2">
      <Link
        href={hrefFor(null)}
        aria-current={active === null ? "true" : undefined}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          active === null
            ? "bg-brand-600 text-white"
            : "border border-brand-300 bg-white text-ink-700 hover:bg-brand-50"
        }`}
      >
        {allLabel}
      </Link>
      {ARTICLE_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          aria-current={active === category ? "true" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            active === category
              ? "bg-brand-600 text-white"
              : "border border-brand-300 bg-white text-ink-700 hover:bg-brand-50"
          }`}
        >
          {labels[category]} ({counts[category]})
        </Link>
      ))}
    </nav>
  );
}

/**
 * Reads `?category=` at request time, so it lives behind a Suspense
 * boundary and the rest of the page stays prerendered.
 */
async function ArticleList({
  locale,
  searchParams,
  labels,
  emptyTitle,
  emptyText,
}: {
  locale: Locale;
  searchParams: Promise<{ category?: string | string[] }>;
  labels: ListLabels;
  emptyTitle: string;
  emptyText: string;
}) {
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const raw = typeof params.category === "string" ? params.category : null;
  const active = raw && (ARTICLE_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as ArticleCategory)
    : null;

  const mode = getSiteMode();
  const all = await getVisibleArticles(mode);

  const counts: Record<ArticleCategory, number> = { demo: 0, guides: 0, news: 0 };
  for (const article of all) counts[article.category] += 1;

  const visible: Article[] = active ? all.filter((a) => a.category === active) : all;

  return (
    <>
      <CategoryChips
        locale={locale}
        active={active}
        allLabel={dict.blog.filterAll}
        navLabel={dict.blog.filterLabel}
        labels={labels.category}
        counts={counts}
      />

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={emptyTitle}
            text={emptyText}
            actionLabel={dict.blog.filterAll}
            actionHref={localizePath(locale, "/blog")}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article, index) => (
            <Reveal key={article.id} delay={index * 60}>
              <ArticleCard article={article} locale={locale} labels={labels} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

export default async function BlogPage({ params, searchParams }: PageProps<"/[lang]/blog">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const labels: ListLabels = {
    readMore: dict.common.readMore,
    publishedOn: dict.blog.publishedOn,
    byAuthor: dict.blog.byAuthor,
    demoBadge: dict.common.demoBadge,
    demoArticleBadge: dict.blog.demoArticleBadge,
    category: {
      demo: dict.blog.categoryDemo,
      guides: dict.blog.categoryGuides,
      news: dict.blog.categoryNews,
    },
  };

  const skeleton = (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-brand-50" />
      ))}
    </div>
  );

  return (
    <>
      <Section tone="soft" className="border-b border-brand-100">
        <Reveal>
          <SectionHeading
            kicker={dict.nav.blog}
            title={dict.blog.title}
            intro={dict.blog.description}
            as="h1"
          />
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <DevBadge label={dict.common.demoBadge} />
            <p className="flex-1 text-sm leading-relaxed text-amber-900 break-words-safe">
              {dict.blog.demoNotice}
            </p>
          </div>
        </Reveal>
      </Section>

      <Section tone="white">
        <Suspense fallback={skeleton}>
          <ArticleList
            locale={locale}
            searchParams={searchParams}
            labels={labels}
            emptyTitle={dict.blog.emptyTitle}
            emptyText={dict.blog.emptyText}
          />
        </Suspense>
      </Section>
    </>
  );
}
