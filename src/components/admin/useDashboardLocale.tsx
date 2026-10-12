"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { dict as dashboardLabels, type DashboardLocale } from "./dashboard-dict";

const LOCALE_KEY = "dt_admin_locale";

/* ------------------------------------------------------------------ */
/* Tiny external store so the shell's language switch and every admin  */
/* page stay in sync in the same tab (localStorage alone cannot do     */
/* that — the storage event only fires across tabs).                   */
/* ------------------------------------------------------------------ */

let currentLocale: DashboardLocale = "en";
let initialized = false;
const listeners = new Set<() => void>();

function readStoredLocale(): DashboardLocale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    return stored === "ar" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentLocale = readStoredLocale();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DashboardLocale {
  ensureInitialized();
  return currentLocale;
}

function getServerSnapshot(): DashboardLocale {
  return "en";
}

function setLocaleStore(next: DashboardLocale) {
  currentLocale = next;
  try {
    window.localStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* storage unavailable — language resets per session */
  }
  for (const listener of listeners) listener();
}

type DashboardI18n = {
  locale: DashboardLocale;
  setLocale: (locale: DashboardLocale) => void;
  t: ReturnType<typeof dashboardLabels>;
  dir: "rtl" | "ltr";
};

/**
 * Dashboard language for the admin shell and every admin page.
 * The choice persists in localStorage and applies instantly across pages.
 */
export function useDashboardLocale(): DashboardI18n {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: DashboardLocale) => setLocaleStore(next), []);

  return useMemo<DashboardI18n>(() => {
    const t = dashboardLabels(locale);
    return { locale, setLocale, t, dir: t.dir };
  }, [locale, setLocale]);
}
