import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleCard from "@/components/ArticleCard";
import ClinicMap from "@/components/ClinicMap";
import DoctorPortrait from "@/components/DoctorPortrait";
import { CtaBand, EmptyState, Section, SectionHeading } from "@/components/Layout";
import Reveal from "@/components/Reveal";
import { whatsappHref } from "@/components/ContactOptions";
import { doctor } from "@/content/doctor";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, type Locale } from "@/i18n/config";
import { getVisibleArticles } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
import { phoneLink } from "@/lib/settings";
import { readSettings } from "@/lib/settings";
import { getSiteMode, SITE_URL } from "@/lib/site";

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
    path: "/",
    title: dict.meta.seo.home.title,
    description: dict.meta.seo.home.description,
    image: "/images/dr-tariq-portrait.png",
  });
}

export default async function HomePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const settings = await readSettings();
  const mode = getSiteMode();
  const articles = await getVisibleArticles(mode);

  const articleLabels = {
    readMore: dict.common.readMore,
    publishedOn: dict.blog.publishedOn,
    byAuthor: dict.blog.byAuthor,
    demoBadge: dict.common.demoBadge,
    demoArticleBadge: dict.blog.demoArticleBadge,
    notInLanguage: dict.blog.notInLanguage,
    readInArabic: dict.blog.readInArabic,
    readInEnglish: dict.blog.readInEnglish,
    reviewPendingBadge: dict.blog.reviewPendingBadge,
    category: {
      demo: dict.blog.categoryDemo,
      guides: dict.blog.categoryGuides,
      news: dict.blog.categoryNews,
    },
  };

  // Qualifications are editable from the dashboard (clinic is the source
  // after editing); the verified content file is the fallback.
  const qualifications =
    settings.doctor.qualifications.length > 0
      ? settings.doctor.qualifications
      : doctor.qualifications;

  // Structured data uses only verified/supplied facts: identity, title and
  // specialties from the brand image; qualifications from the hospital page.
  // No address (conflicting sources), no geo coordinates, no ratings.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.fullName[locale],
    jobTitle: doctor.professionalTitle[locale],
    url: `${SITE_URL}${localizePath(locale, "/")}`,
    image: `${SITE_URL}/images/dr-tariq-portrait.png`,
    inLanguage: locale,
    medicalSpecialty: ["InternalMedicine", "Nephrology", "Hypertension"],
    knowsLanguage: doctor.languagesSource
      ? locale === "ar"
        ? doctor.languages
        : doctor.languagesEn
      : undefined,
    availableService: doctor.specialties.map((specialty) => ({
      "@type": "MedicalProcedure",
      name: specialty[locale],
    })),
    workLocation: {
      "@type": "MedicalClinic",
      name: dict.home.contactTitle,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <p className="text-xs font-bold tracking-widest text-brand-600 uppercase">
              {dict.home.heroKicker}
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-bold text-navy-900 break-words-safe sm:text-6xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-4 inline-flex rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 break-words-safe">
              {dict.home.heroTitleNote}
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500 break-words-safe">
              {dict.home.heroLead}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={localizePath(locale, "/book")}
                className="rounded-full bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(11,116,201,0.9)] transition-transform hover:-translate-y-0.5 hover:bg-brand-700"
              >
                {dict.home.heroPrimary}
              </Link>
              <Link
                href={localizePath(locale, "/about")}
                className="rounded-full border border-brand-300 bg-white px-7 py-3.5 text-sm font-bold text-navy-900 transition-colors hover:border-brand-500 hover:text-brand-700"
              >
                {dict.home.heroSecondary}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <figure className="mx-auto max-w-sm">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 shadow-[0_24px_60px_-32px_rgba(8,33,63,0.45)]">
                <DoctorPortrait
                  alt={dict.common.portraitAlt}
                  priority
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 60vw, 90vw"
                />
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ---------------- About ---------------- */}
      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <SectionHeading
              title={dict.home.aboutTitle}
              intro={dict.home.aboutText}
            />
            <Link
              href={localizePath(locale, "/about")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg py-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-600"
            >
              {dict.home.aboutLink}
              <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </Link>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
              <p className="text-sm font-bold tracking-wide text-brand-700 uppercase">
                {dict.home.qualificationsTitle}
              </p>
              <p className="mt-3 text-sm text-ink-500">{dict.home.qualificationsIntro}</p>
              <ul className="mt-5 space-y-3">
                {qualifications.map((item) => (
                  <li
                    key={item.en}
                    className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm text-ink-700"
                  >
                    <span aria-hidden="true" className="text-brand-600">✓</span>
                    <span className="break-words-safe">{item[locale]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- Specialties ---------------- */}
      <Section tone="soft">
        <Reveal>
          <SectionHeading
            kicker={dict.home.specialtiesKicker}
            title={dict.home.servicesTitle}
            intro={dict.home.servicesIntro}
          />
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dict.home.services.map((service, index) => (
            <Reveal key={service.title} delay={index * 80}>
              <div className="h-full rounded-2xl border border-brand-100 bg-white p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
                >
                  ✚
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy-900 break-words-safe">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 break-words-safe">
                  {service.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------- Latest articles ---------------- */}
      <Section tone="white">
        <Reveal>
          <SectionHeading
            kicker={dict.nav.blog}
            title={dict.home.articlesTitle}
            intro={dict.home.articlesText}
          />
        </Reveal>

        {articles.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={dict.home.articlesEmpty}
              text={dict.home.articlesText}
              actionLabel={dict.nav.book}
              actionHref={localizePath(locale, "/book")}
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((article, index) => (
              <Reveal key={article.id} delay={index * 80}>
                <ArticleCard article={article} locale={locale} labels={articleLabels} />
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href={localizePath(locale, "/blog")}
            className="inline-flex items-center gap-2 rounded-lg py-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-600"
          >
            {dict.common.readMore}
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </Link>
        </div>
      </Section>

      {/* ---------------- Clinic / contact ---------------- */}
      <Section tone="soft">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <SectionHeading
              kicker={dict.footer.contact}
              title={dict.home.contactTitle}
              intro={dict.home.contactText}
            />

            <dl className="mt-8 space-y-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <dt className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                  {dict.book.mobileTitle}
                </dt>
                <dd className="mt-1.5 text-sm text-ink-700 break-words-safe">
                  {settings.contact.phone ? (
                    <a
                      href={phoneLink(settings.contact.phone, settings.contact.phoneIntl) ?? "#"}
                      className="inline-flex min-h-11 items-center text-lg font-bold text-navy-900 hover:text-brand-700"
                      dir="ltr"
                    >
                      {settings.contact.phone}
                    </a>
                  ) : (
                    dict.home.contactPlaceholder
                  )}
                </dd>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <dt className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                  {dict.book.landlineTitle}
                </dt>
                <dd className="mt-1.5 text-sm text-ink-700 break-words-safe">
                  {settings.contact.landline ? (
                    <a
                      href={phoneLink(settings.contact.landline, settings.contact.landlineIntl) ?? "#"}
                      className="inline-flex min-h-11 items-center text-lg font-bold text-navy-900 hover:text-brand-700"
                      dir="ltr"
                    >
                      {settings.contact.landline}
                    </a>
                  ) : (
                    dict.home.contactPlaceholder
                  )}
                </dd>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <dt className="text-xs font-bold tracking-wide text-brand-700 uppercase">
                  {dict.home.locationCardLabel}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-700 break-words-safe">
                  {settings.contact.address?.[locale] ?? dict.home.contactPlaceholder}
                </dd>
              </div>
            </dl>

            {settings.contact.whatsappEnabled ? (
              <a
                href={
                  whatsappHref(
                    settings.contact.whatsapp,
                    settings.contact.whatsappMessage?.[locale],
                  ) ?? "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-[#25D366] bg-white px-6 text-sm font-bold text-[#128C7E] transition-colors hover:bg-[#25D366]/10"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {dict.book.whatsappAction}
              </a>
            ) : null}
            <p className="mt-3 text-xs text-ink-500 break-words-safe">{dict.book.whatsappNote}</p>
          </Reveal>

          <Reveal delay={100}>
            <ClinicMap
              embedUrl={settings.contact.mapsEmbedUrl}
              placeUrl={settings.contact.mapsPlaceUrl}
              address={settings.contact.address?.[locale] ?? null}
              heading={dict.home.locationTitle}
              intro={dict.home.locationText}
              openLabel={dict.home.openInMaps}
              mapTitle={dict.home.mapTitle}
              addressLabel={dict.home.contactTitle}
            />
          </Reveal>
        </div>
      </Section>

      <CtaBand
        title={dict.home.finalCtaTitle}
        text={dict.home.finalCtaText}
        actionLabel={dict.home.heroPrimary}
        actionHref={localizePath(locale, "/book")}
      />
    </>
  );
}
