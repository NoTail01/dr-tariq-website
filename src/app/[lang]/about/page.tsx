import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DoctorPortrait from "@/components/DoctorPortrait";
import JsonLd from "@/components/JsonLd";
import { BulletIcon, CheckIcon } from "@/components/Icons";
import { CtaBand, Section, SectionHeading } from "@/components/Layout";
import Reveal from "@/components/Reveal";
import { doctor } from "@/content/doctor";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, type Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import {
  breadcrumbNode,
  clinicNode,
  jsonLdGraph,
  organizationNode,
  physicianNode,
  PHYSICIAN_ID,
} from "@/lib/structured-data";
import { readSettings } from "@/lib/settings";

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
    path: "/about",
    title: dict.meta.seo.about.title,
    description: dict.meta.seo.about.description,
    image: "/images/dr-tariq-portrait.png",
  });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const settings = await readSettings();

  const pageUrl = SITE_URL + localizePath(locale, "/about");
  const jsonLd = jsonLdGraph([
    organizationNode(locale, settings),
    physicianNode(locale, settings),
    clinicNode(locale, settings),
    {
      "@type": "ProfilePage",
      "@id": pageUrl + "#profile",
      url: pageUrl,
      name: dict.about.title,
      description: dict.about.description,
      inLanguage: locale,
      mainEntity: { "@id": PHYSICIAN_ID },
      breadcrumb: { "@id": pageUrl + "#breadcrumb" },
    },
    {
      ...breadcrumbNode([
        { name: dict.nav.home, url: SITE_URL + localizePath(locale, "/") },
        { name: dict.about.title, url: pageUrl },
      ]),
      "@id": pageUrl + "#breadcrumb",
    },
  ]);

  // Biography and qualifications are editable from the dashboard; the
  // verified content file remains the fallback for fresh installs.
  const biography = settings.doctor.biography[locale] || doctor.biography[locale];
  const qualifications =
    settings.doctor.qualifications.length > 0
      ? settings.doctor.qualifications
      : doctor.qualifications;

  return (
    <>
      <JsonLd data={jsonLd} />

      <Section tone="soft" className="border-b border-brand-100">
        <Reveal immediate>
          <SectionHeading
            kicker={dict.nav.about}
            title={dict.about.title}
            intro={dict.about.description}
            as="h1"
          />
        </Reveal>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal immediate>
            <figure>
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 shadow-[0_24px_60px_-32px_rgba(8,33,63,0.45)]">
                <DoctorPortrait
                  alt={dict.common.portraitAlt}
                  priority
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 60vw, 90vw"
                />
              </div>
              <figcaption className="mt-3 text-sm text-ink-500 break-words-safe">
                {dict.about.portraitNote}
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={100} className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">{dict.about.bioTitle}</h2>
              <p className="mt-3 leading-relaxed text-ink-700 break-words-safe">
                {biography}
              </p>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-6">
              <h2 className="text-xl font-bold text-navy-900">{dict.about.qualificationsTitle}</h2>
              <p className="mt-2 text-sm text-ink-500">{dict.about.qualificationsIntro}</p>
              <ul className="mt-5 space-y-3">
                {qualifications.map((item) => (
                  <li
                    key={item.en}
                    className="flex items-start gap-3 rounded-xl bg-white p-3.5 text-sm text-ink-700"
                  >
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span className="break-words-safe">{item[locale]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-500 break-words-safe">
                {dict.about.qualificationsNote}
              </p>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">{dict.about.membershipsTitle}</h2>
              <ul className="mt-4 space-y-3">
                {dict.about.membershipsNotes.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5 text-sm text-ink-700"
                  >
                    <BulletIcon className="mt-2 text-brand-600" />
                    <span className="break-words-safe">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">{dict.about.specialtiesTitle}</h2>
              <p className="mt-2 text-sm text-ink-500">{dict.about.specialtiesIntro}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {doctor.specialties.map((item) => (
                  <span
                    key={item.en}
                    className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                  >
                    {item[locale]}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-white p-6">
              <h2 className="text-xl font-bold text-navy-900">{dict.about.languagesTitle}</h2>
              <p className="mt-2 text-sm text-ink-500">{dict.about.languagesIntro}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {(locale === "ar" ? doctor.languages : doctor.languagesEn).map((language) => (
                  <span
                    key={language}
                    className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-ink-700"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-navy-900 p-6 text-brand-100">
              <h2 className="text-xl font-bold text-white">{dict.about.sourcesTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-100/85 break-words-safe">
                {dict.about.sourcesText}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-brand-100/70">
                {dict.about.sourcesList.map((source) => (
                  <li key={source} className="break-words-safe">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
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
