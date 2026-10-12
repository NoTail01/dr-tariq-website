import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BookForm from "@/components/BookForm";
import ClinicMap from "@/components/ClinicMap";
import ContactOptions from "@/components/ContactOptions";
import MobileCallBar from "@/components/MobileCallBar";
import { Section, SectionHeading } from "@/components/Layout";
import Reveal from "@/components/Reveal";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { phoneLink } from "@/lib/settings";
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
    path: "/book",
    title: dict.meta.seo.book.title,
    description: dict.meta.seo.book.description,
  });
}

export default async function BookPage({ params }: PageProps<"/[lang]/book">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const settings = await readSettings();

  const channelLabels = {
    mobileTitle: dict.book.mobileTitle,
    mobileText: dict.book.mobileText,
    landlineTitle: dict.book.landlineTitle,
    landlineText: dict.book.landlineText,
    callAction: dict.book.callAction,
    whatsappTitle: dict.book.whatsappTitle,
    whatsappText: dict.book.whatsappText,
    whatsappPending: dict.book.whatsappPending,
    whatsappAction: dict.book.whatsappAction,
    emailTitle: dict.book.emailTitle,
    emailText: dict.book.emailText,
    emailAction: dict.book.emailAction,
    disabledNotice: dict.book.disabledNotice,
  };

  return (
    <>
      <Section tone="soft" className="border-b border-brand-100">
        <Reveal>
          <SectionHeading
            kicker={dict.common.bookingCta}
            title={dict.book.title}
            intro={dict.book.intro}
            as="h1"
          />
        </Reveal>
      </Section>

      <Section tone="white">
        <Reveal>
          <SectionHeading title={dict.book.optionsTitle} />
        </Reveal>
        <div className="mt-8">
          <Reveal>
            <ContactOptions contact={settings.contact} labels={channelLabels} />
          </Reveal>
        </div>
      </Section>

      {/* ---------------- Location + map ---------------- */}
      <Section tone="soft">
        <Reveal>
          <ClinicMap
            embedUrl={settings.contact.mapsEmbedUrl}
            placeUrl={settings.contact.mapsPlaceUrl}
            address={settings.contact.address?.[locale] ?? null}
            heading={dict.home.locationTitle}
            intro={dict.home.locationText}
            openLabel={dict.home.openInMaps}
            mapTitle={dict.home.mapTitle}
            addressLabel={dict.book.optionsTitle}
          />
        </Reveal>
      </Section>

      {/* ---------------- Demo request form ---------------- */}
      <Section tone="white" className="pb-28 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Reveal>
            <SectionHeading
              kicker={dict.nav.book}
              title={dict.book.requestTitle}
              intro={dict.book.requestText}
            />
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">{dict.book.formNotice}</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">
                {dict.book.privacyNotice}
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(8,33,63,0.6)] sm:p-8">
              <BookForm labels={dict.book} />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Compact call action on phones only — the page reserves space above
          so the bar never covers content or other controls. */}
      <MobileCallBar
        href={phoneLink(settings.contact.phone, settings.contact.phoneIntl) ?? "#"}
        prompt={dict.book.mobileCallPrompt}
        action={dict.book.callAction}
      />
    </>
  );
}
