import { ar } from "./ar";
import { en } from "./en";
import type { Locale } from "./config";

export type { Dictionary } from "./en";

const dictionaries = {
  ar: async () => ar,
  en: async () => en,
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
