import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { categoryLabel, formatDate, readingTimeText } from "@/components/ArticleCard";
import { DevBadge } from "@/components/PlaceholderImage";
import { Section } from "@/components/Layout";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, locales, type Locale } from "@/i18n/config";
import { findVisibleArticle, readAllArticles } from "@/lib/articles";
import Markdown, { extractHeadings } from "@/components/Markdown";
import { pageMetadata } from "@/lib/seo";
import { getSiteMode, SITE_URL } from "@/lib/site";

type Params = { lang: string; slug: string };

/**
 * The article body depends on `params` (locale + slug), so a navigation into
 * this route is allowed to block on the server rather than being validated
 * for instant navigation. Documented fix for the instant-navigation
 * validation warning on `/blog/[slug]`.
 */
export const instant = false;

/**
 * Known slugs are prerendered for both locales. Slugs whose article is not
 * visible (for example demo articles in a production build) call `notFound()`
 * and ship as 404s; unknown slugs render on demand.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const articles = await readAllArticles();
  return articles.flatMap((article) =>
    locales
      .map((lang) => ({ lang, slug: article.slug[lang] }))
      .filter((entry) => entry.slug.length > 0),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  const article = await findVisibleArticle(lang, slug, getSiteMode());

  if (!article) {
    return { title: dict.common.notFoundTitle, robots: { index: false, follow: false } };
  }

  const title = article.seo.title[lang] || article.title[lang];
  const description = article.seo.description[lang] || article.excerpt[lang];

  return pageMetadata({
    locale: lang,
    path: `/blog/${article.slug[lang]}`,
    title,
    description,
    noindex: article.isDemo,
    ogType: "article",
    publishedTime: article.publishedAt ?? undefined,
    modifiedTime: article.updatedAt,
  });
}

export default async function ArticlePage({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const mode = getSiteMode();

  const article = await findVisibleArticle(locale, slug, mode);
  if (!article) notFound();

  const articleUrl = `${SITE_URL}${localizePath(locale, `/blog/${article.slug[locale]}`)}`;

  // A table of contents is only worth its space on the longer articles.
  const headings = extractHeadings(article.body[locale]);

  // Breadcrumbs: Home > Blog > Article, with matching BreadcrumbList JSON-LD.
  const crumbs = [
    { name: dict.nav.home, href: localizePath(locale, "/") },
    { name: dict.blog.title, href: localizePath(locale, "/blog") },
    { name: article.title[locale], href: localizePath(locale, `/blog/${article.slug[locale]}`) },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href}`,
    })),
  };

  // Article structured data is emitted only for medically approved,
  // published articles — never for content awaiting the doctor's review,
  // and never with a fabricated reviewer or author.
  const jsonLd =
    article.review.status === "approved" && article.status === "published"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.title[locale],
          description: article.excerpt[locale],
          inLanguage: locale,
          url: articleUrl,
          datePublished: article.publishedAt ?? undefined,
          dateModified: article.updatedAt,
          author: { "@type": "Organization", name: article.author[locale] },
          publisher: { "@type": "Organization", name: dict.meta.siteName },
          ...(article.coverImage ? { image: `${SITE_URL}${article.coverImage.url}` } : {}),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c"),
        }}
      />
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <Section tone="soft" className="border-b border-brand-100">
        <div className="max-w-3xl">
          {/* Visible breadcrumb navigation */}
          <nav aria-label={dict.blog.title} className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
              {crumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {index === crumbs.length - 1 ? (
                    <span aria-current="page" className="text-ink-700">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-brand-700">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <Link
            href={localizePath(locale, "/blog")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
          >
            <span aria-hidden="true" className="rtl:rotate-180">←</span>
            {dict.common.backToBlog}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              {categoryLabel(article.category, {
                demo: dict.blog.categoryDemo,
                guides: dict.blog.categoryGuides,
                news: dict.blog.categoryNews,
              })}
            </span>
            {article.isDemo ? <DevBadge label={dict.blog.demoArticleBadge} /> : null}
            {article.review.status === "approved" ? null : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {dict.blog.reviewPendingBadge}
              </span>
            )}
          </div>

          {/* Pending medical review is stated explicitly so a published
              article is never mistaken for doctor-approved content. */}
          {article.review.status === "approved" ? null : (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              {dict.blog.reviewPendingNote}
            </p>
          )}

          <h1 className="mt-4 text-3xl leading-tight font-bold text-navy-900 break-words-safe sm:text-4xl">
            {article.title[locale]}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-500">
            <span>
              {dict.blog.byAuthor} {article.author[locale]}
            </span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>
                {dict.blog.publishedOn} {formatDate(article.publishedAt, locale)}
              </time>
            ) : null}
            <span>
              {readingTimeText(article, locale)}
            </span>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <article className="max-w-3xl">
          {article.coverImage ? (
            <figure className="mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImage.url}
                alt={article.coverImage.alt[locale]}
                className="w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </figure>
          ) : null}

          {/* The excerpt repeats the body's opening lines verbatim, so it is
              not shown again as a lead paragraph: SEO keeps using
              `seo.description`, and the reader gets the text once. */}
          {headings.length >= 4 ? (
            <nav
              aria-label={dict.blog.tocTitle}
              className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-5"
            >
              <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                {dict.blog.tocTitle}
              </p>
              <ol className="mt-3 space-y-2">
                {headings.map((heading, hi) => (
                  <li key={heading.id} className="flex gap-2.5 text-sm">
                    <span className="font-semibold text-brand-600" aria-hidden="true">
                      {hi + 1}.
                    </span>
                    <a
                      href={`#${heading.id}`}
                      className="font-medium text-navy-800 underline decoration-brand-200 underline-offset-4 transition-colors hover:text-brand-700"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="mt-6 border-t border-brand-100 pt-6">
            <Markdown source={article.body[locale]} />
          </div>

          {article.sourceUrl ? (
            <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                {dict.about.sourcesTitle}
              </p>
              <a
                href={article.sourceUrl}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-900"
              >
                {article.sourceUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : null}

          {/* One clear clinic-contact call to action at the end of the
              article — the body's own link remains as an inline fallback. */}
          <div className="mt-8 rounded-2xl border border-brand-200 bg-white p-6 text-center">
            <p className="text-base font-semibold text-navy-900">
              {dict.blog.contactCtaTitle}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
              {dict.blog.contactCtaText}
            </p>
            <Link
              href={localizePath(locale, "/book")}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              {dict.common.bookingCta}
            </Link>
            <p className="mt-3 text-xs text-ink-500">{dict.book.contactCtaNote}</p>
          </div>
        </article>

        {/* The body already links its related articles, so a second "latest
            articles" grid here would repeat the same links. */}
      </Section>
    </>
  );
}
