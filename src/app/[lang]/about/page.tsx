import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DevBadge, PlaceholderImage } from "@/components/PlaceholderImage";
import { CtaBand, Section, SectionHeading } from "@/components/Layout";
import Reveal from "@/components/Reveal";
import { doctor } from "@/content/doctor";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localizePath, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { locales } from "@/i18n/config";

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
    title: dict.about.title,
    description: dict.about.description,
  });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const biography = doctor.biography[locale];

  return (
    <>
      <Section tone="soft" className="border-b border-brand-100">
        <Reveal>
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
          <Reveal>
            <PlaceholderImage
              alt={dict.about.portraitAlt}
              note={dict.about.portraitNote}
              badgeLabel={dict.common.devNoticeBadge}
              aspect="aspect-[4/5]"
            />
          </Reveal>

          <Reveal delay={100} className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-navy-900">{dict.about.bioTitle}</h2>
                <DevBadge label={dict.common.devNoticeBadge} />
              </div>
              <p className="mt-3 text-sm text-amber-800">{dict.about.bioDevNote}</p>
              <p className="mt-4 leading-relaxed text-ink-700 break-words-safe">
                {biography ?? dict.about.bioPlaceholder}
              </p>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-navy-900">
                  {dict.about.qualificationsTitle}
                </h2>
                <DevBadge label={dict.common.awaitingVerification} />
              </div>
              <p className="mt-2 text-sm text-ink-500">{dict.about.qualificationsDevNote}</p>
              <ul className="mt-5 space-y-3">
                {dict.about.qualifications.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl bg-white p-3.5 text-sm text-ink-700"
                  >
                    <span aria-hidden="true" className="text-amber-500">⏳</span>
                    <span className="break-words-safe">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-white p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-navy-900">
                  {dict.about.specialtiesTitle}
                </h2>
                <DevBadge label={dict.common.awaitingVerification} />
              </div>
              <p className="mt-2 text-sm text-ink-500">{dict.about.specialtiesDevNote}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {(doctor.specialties.length > 0
                  ? doctor.specialties.map((item) => item[locale])
                  : dict.about.specialties
                ).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-dashed border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-navy-900 p-6 text-brand-100">
              <h2 className="text-xl font-bold text-white">{dict.about.sourcesTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-100/85 break-words-safe">
                {dict.about.sourcesText}
              </p>
              <p className="mt-4 text-xs text-brand-100/70">
                {doctor.fullName[locale]} — {doctor.fullName.source}
              </p>
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
