import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";

import "../globals.css";

import Analytics from "@/components/Analytics";
import CurrentYear from "@/components/CurrentYear";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeInfo, locales, localizePath, type Locale } from "@/i18n/config";
import { getAnalyticsConfig } from "@/lib/analytics";
import { plexArabic } from "@/lib/font";
import { readSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

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
  const config = getAnalyticsConfig();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.defaultTitle,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.defaultDescription,
    ...(config.searchConsoleVerification
      ? { verification: { google: config.searchConsoleVerification } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#0097f3",
  width: "device-width",
  initialScale: 1,
};

/**
 * Year captured when this server module loads (build time for prerendered
 * pages). The footer corrects it to the visitor's current year after
 * hydration — `new Date()` must not run inside the prerendered shell.
 */
const SHELL_YEAR = new Date().getFullYear();

export default async function LocaleLayout({ children }: LayoutProps<"/[lang]">) {
  // Read the root parameter via `next/root-params` (documented pattern for
  // root layouts) so the locale is known at build time and the shell can be
  // prerendered instead of awaiting the runtime `params` prop.
  const lang = await rootLang();
  if (!lang || !isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const settings = await readSettings();
  const analytics = getAnalyticsConfig();
  const info = localeInfo[locale];

  const navLabels = {
    home: dict.nav.home,
    about: dict.nav.about,
    blog: dict.nav.blog,
    book: dict.nav.book,
    skipToContent: dict.nav.skipToContent,
    openMenu: dict.nav.openMenu,
    closeMenu: dict.nav.closeMenu,
  };

  const quickLinks = [
    { href: localizePath(locale, "/"), label: dict.nav.home },
    { href: localizePath(locale, "/about"), label: dict.nav.about },
    { href: localizePath(locale, "/blog"), label: dict.nav.blog },
    { href: localizePath(locale, "/book"), label: dict.nav.book },
  ];

  // Phone line shown in the footer: both published clinic lines.
  const phoneLine = [settings.contact.phone, settings.contact.landline]
    .filter((value): value is string => Boolean(value))
    .join("  ·  ");

  return (
    <html
      lang={info.htmlLang}
      dir={info.dir}
      data-scroll-behavior="smooth"
      className={`${plexArabic.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
        >
          {dict.nav.skipToContent}
        </a>

        <SiteHeader
          locale={locale}
          labels={navLabels}
          brandName={settings.siteName[locale]}
          logoSrc={settings.branding.logoUrl ?? "/images/logo-emblem.png"}
          logoAlt={dict.common.portraitAlt}
          bookCta={dict.common.bookingCta}
          switchLanguage={dict.nav.switchLanguage}
          switchLanguageLabel={dict.nav.switchLanguageLabel}
        />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <SiteFooter
          brandName={settings.siteName[locale]}
          brandTitle={settings.tagline[locale]}
          logoSrcDark={settings.branding.logoUrlDark ?? "/images/logo-emblem-transparent.png"}
          logoAlt={dict.common.portraitAlt}
          linksTitle={dict.footer.quickLinks}
          links={quickLinks}
          developedNote={settings.footerNote[locale] || dict.footer.developedNote}
          contactTitle={dict.footer.contact}
          address={settings.contact.address?.[locale] ?? null}
          phoneLine={phoneLine || null}
          whatsappNote={settings.contact.whatsappEnabled ? null : dict.book.whatsappPending}
          disclaimerTitle={dict.footer.disclaimerTitle}
          disclaimer={dict.footer.disclaimer}
          rights={dict.footer.rights}
          year={<CurrentYear fallback={SHELL_YEAR} />}
        />

        <Analytics config={analytics} />
      </body>
    </html>
  );
}
