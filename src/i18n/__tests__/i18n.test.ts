import { describe, expect, it } from "vitest";

import { getDictionary } from "@/i18n/dictionaries";
import {
  defaultLocale,
  isLocale,
  isRtl,
  localizePath,
  splitLocale,
  switchLocalePath,
} from "@/i18n/config";

/** Flatten a nested dictionary into dot-paths for key-parity checks. */
function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    keys.push(...flattenKeys(child, path));
  }
  return keys;
}

/** Every dictionary leaf must be a string — never an empty object or array. */
function walkLeaves(value: unknown, path: string): Array<{ path: string; type: string }> {
  if (typeof value !== "object" || value === null) {
    return typeof value === "string" ? [] : [{ path, type: typeof value }];
  }
  const problems: Array<{ path: string; type: string }> = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    problems.push(...walkLeaves(child, path ? `${path}.${key}` : key));
  }
  return problems;
}

describe("i18n dictionaries", () => {
  it("keeps Arabic and English keys in sync", async () => {
    const arDict = await getDictionary("ar");
    const enDict = await getDictionary("en");

    const arKeys = flattenKeys(arDict).sort();
    const enKeys = flattenKeys(enDict).sort();

    expect(arKeys).toEqual(enKeys);
  });

  it("only contains string leaves", async () => {
    const arDict = await getDictionary("ar");
    const enDict = await getDictionary("en");
    expect(walkLeaves(arDict, "")).toEqual([]);
    expect(walkLeaves(enDict, "")).toEqual([]);
  });

  it("every nav label is present and non-empty", async () => {
    const enDict = await getDictionary("en");
    const arDict = await getDictionary("ar");
    for (const key of ["home", "about", "blog", "book"] as const) {
      expect(enDict.nav[key].length).toBeGreaterThan(0);
      expect(arDict.nav[key].length).toBeGreaterThan(0);
    }
  });
});

describe("locale path helpers", () => {
  it("localizes root and nested paths", () => {
    expect(localizePath("ar", "/")).toBe("/ar");
    expect(localizePath("en", "/about")).toBe("/en/about");
    expect(localizePath("ar", "blog")).toBe("/ar/blog");
  });

  it("splits locale-agnostic paths", () => {
    expect(splitLocale("/ar/blog/demo-post")).toEqual({
      locale: "ar",
      path: "/blog/demo-post",
    });
    expect(splitLocale("/blog/demo-post")).toEqual({ locale: null, path: "/blog/demo-post" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
  });

  it("switches language to the equivalent page", () => {
    expect(switchLocalePath("/ar/book", "en")).toBe("/en/book");
    expect(switchLocalePath("/en/about", "ar")).toBe("/ar/about");
    expect(switchLocalePath("/ar", "en")).toBe("/en");
  });

  it("identifies locales and direction", () => {
    expect(defaultLocale).toBe("ar");
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
});