import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Visual regression check for the About page list markers.
 *
 * The memberships bullet once rendered as an unbounded SVG: a viewBox-only SVG
 * takes 100% of its flex line, so the marker grew to ~560px and the note text
 * collapsed into a one-character column. This harness measures the real
 * bounding boxes in Chromium and fails if the marker or the text regresses.
 *
 * Usage:
 *   node scripts/qa-memberships.mjs [baseUrl] [label]
 */

const base = process.argv[2] ?? "http://localhost:3000";
const label = process.argv[3] ?? "after";
const outDir = path.resolve("artifacts/qa/memberships-" + label);
await mkdir(outDir, { recursive: true });

const widths = [390, 768, 1024, 1366, 1920];
const locales = ["en", "ar"];
const titles = { en: "Memberships", ar: "العضويات" };
const MAX_MARKER = 12.5;
const MIN_TEXT_WIDTH = 200;
const MAX_TEXT_LINES = 6;

const browser = await chromium.launch({ headless: true });
const results = [];
let failures = 0;

for (const locale of locales) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width < 700 ? 900 : 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(base + "/" + locale + "/about", { waitUntil: "networkidle" });
    await page.waitForSelector("h2");

    const data = await page.evaluate((title) => {
      const heading = [...document.querySelectorAll("h2")].find(
        (element) => element.textContent.trim() === title,
      );
      const card = heading?.closest("div");
      if (!card) return { found: false };
      const items = [...card.querySelectorAll("li")].map((li) => {
        const marker = li.querySelector("svg");
        const text = li.querySelector("span");
        const markerRect = marker?.getBoundingClientRect();
        const textRect = text?.getBoundingClientRect();
        const lineHeight = text ? parseFloat(getComputedStyle(text).lineHeight) : 0;
        return {
          markerWidth: markerRect ? Math.round(markerRect.width * 10) / 10 : null,
          markerHeight: markerRect ? Math.round(markerRect.height * 10) / 10 : null,
          textWidth: textRect ? Math.round(textRect.width) : null,
          textLines: textRect && lineHeight ? Math.round(textRect.height / lineHeight) : null,
        };
      });
      return {
        found: true,
        dir: document.documentElement.dir,
        lang: document.documentElement.lang,
        items,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    }, titles[locale]);

    const shot = path.join(outDir, locale + "-" + width + ".png");
    await page.screenshot({ path: shot });

    const problems = [];
    if (!data.found) problems.push("memberships section not found");
    if (data.overflow) problems.push("horizontal overflow");
    for (const [index, item] of (data.items ?? []).entries()) {
      const tag = "item " + (index + 1);
      if (item.markerWidth === null || item.markerHeight === null) {
        problems.push(tag + ": marker missing");
        continue;
      }
      if (item.markerWidth > MAX_MARKER || item.markerHeight > MAX_MARKER) {
        problems.push(
          tag + ": marker " + item.markerWidth + "x" + item.markerHeight + " exceeds " + MAX_MARKER + "px",
        );
      }
      if (item.markerWidth !== item.markerHeight) {
        problems.push(tag + ": marker is not square");
      }
      if (item.textWidth === null || item.textWidth < MIN_TEXT_WIDTH) {
        problems.push(tag + ": text width " + item.textWidth + "px is below " + MIN_TEXT_WIDTH + "px");
      }
      if (item.textLines !== null && item.textLines > MAX_TEXT_LINES) {
        problems.push(tag + ": text wraps into " + item.textLines + " lines");
      }
    }
    if (locale === "ar" && data.dir !== "rtl") problems.push("Arabic page is not RTL");
    if (locale === "en" && data.dir !== "ltr") problems.push("English page is not LTR");

    failures += problems.length;
    results.push({ locale, width, shot, problems, items: data.items });
    await context.close();
  }
}

await browser.close();

for (const row of results) {
  const summary = row.items
    .map((item) => "marker " + item.markerWidth + "px, text " + item.textWidth + "px")
    .join(" | ");
  console.log(
    row.locale + " @" + row.width + ": " + summary + (row.problems.length ? " FAIL: " + row.problems.join("; ") : " ok"),
  );
}

console.log(failures === 0 ? "PASS: " + results.length + " viewport checks" : "FAIL: " + failures + " problems");
process.exit(failures === 0 ? 0 : 1);
