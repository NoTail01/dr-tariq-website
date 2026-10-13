import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { categoryLabel, formatDate, readingTimeText } from "@/components/ArticleCard";
import { DevBadge } from "@/components/PlaceholderImage";
import { Section } from "@/components/Layout";
import Markdown from "@/components/Markdown";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, locales, type Locale } from "@/i18n/config";
import { findVisibleArticle, getVisibleArticles, readAllArticles } from "@/lib/articles";
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

  const others = (await getVisibleArticles(mode))
    .filter((a) => a.id !== article.id && a.slug[locale].length > 0)
    .slice(0, 3);

  const articleUrl = `${SITE_URL}${localizePath(locale, `/blog/${article.slug[locale]}`)}`;

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
          </div>

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

          <p className="text-lg leading-relaxed text-navy-800 break-words-safe">
            {article.excerpt[locale]}
          </p>

          <div className="mt-6 border-t border-brand-100 pt-6">
            <Markdown source={article.body[locale]} />
          </div>

          {article.sourceUrl ? (
            <p className="mt-8 rounded-xl bg-brand-50 p-4 text-sm text-ink-700 break-words-safe">
              <span className="font-semibold">{dict.about.sourcesTitle}: </span>
              <a
                href={article.sourceUrl}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="text-brand-700 underline"
              >
                {article.sourceUrl}
              </a>
            </p>
          ) : null}
        </article>

        {others.length > 0 ? (
          <div className="mt-14 border-t border-brand-100 pt-10">
            <h2 className="text-xl font-bold text-navy-900">{dict.home.articlesTitle}</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link
                    href={localizePath(locale, `/blog/${other.slug[locale]}`)}
                    className="block h-full rounded-xl border border-brand-100 p-4 text-sm font-semibold text-navy-900 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    {other.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>
    </>
  );
}
