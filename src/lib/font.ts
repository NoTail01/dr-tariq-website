import { IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * One family for both languages: IBM Plex Sans Arabic covers Arabic and Latin.
 * `swap` keeps the page readable while the font loads.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
  adjustFontFallback: false,
});
