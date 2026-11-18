import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const artifactDir = path.join(root, "artifacts", "qa");
const shotDir = path.join(artifactDir, "screenshots");
const PUBLIC = "http://localhost:3000";
const DEV = "http://localhost:3001";

const viewports = [
  { width: 360, height: 800, name: "360" },
  { width: 390, height: 844, name: "390" },
  { width: 768, height: 1024, name: "768" },
  { width: 1024, height: 768, name: "1024" },
  { width: 1440, height: 900, name: "1440" },
  { width: 1920, height: 1080, name: "1920" },
];

const captureWidths = new Set(["360", "390", "1440"]);

const pages = [
  { id: "home", locale: "en", path: "/en", origin: PUBLIC, kind: "public", label: "Homepage EN" },
  { id: "home", locale: "ar", path: "/ar", origin: PUBLIC, kind: "public", label: "Homepage AR" },
  { id: "about", locale: "en", path: "/en/about", origin: PUBLIC, kind: "public", label: "About EN" },
  { id: "about", locale: "ar", path: "/ar/about", origin: PUBLIC, kind: "public", label: "About AR" },
  { id: "blog", locale: "en", path: "/en/blog", origin: PUBLIC, kind: "public", label: "Blog EN" },
  { id: "blog", locale: "ar", path: "/ar/blog", origin: PUBLIC, kind: "public", label: "Blog AR" },
  { id: "article", locale: "en", path: "/en/blog/chronic-kidney-disease", origin: PUBLIC, kind: "public", label: "Article EN" },
  { id: "article", locale: "ar", path: "/ar/blog/chronic-kidney-disease", origin: PUBLIC, kind: "public", label: "Article AR" },
  { id: "booking", locale: "en", path: "/en/book", origin: PUBLIC, kind: "public", label: "Booking EN" },
  { id: "booking", locale: "ar", path: "/ar/book", origin: PUBLIC, kind: "public", label: "Booking AR" },
  { id: "admin-login", locale: "en", path: "/admin/login", origin: PUBLIC, kind: "admin-login", label: "Admin login EN" },
  { id: "admin-login", locale: "ar", path: "/admin/login", origin: PUBLIC, kind: "admin-login", label: "Admin login AR" },
  { id: "dashboard", locale: "en", path: "/admin", origin: DEV, kind: "admin", label: "Dashboard EN" },
  { id: "dashboard", locale: "ar", path: "/admin", origin: DEV, kind: "admin", label: "Dashboard AR" },
  { id: "admin-articles", locale: "en", path: "/admin/articles", origin: DEV, kind: "admin", label: "Admin articles EN" },
  { id: "admin-articles", locale: "ar", path: "/admin/articles", origin: DEV, kind: "admin", label: "Admin articles AR" },
  { id: "editor", locale: "en", path: "/admin/articles/new", origin: DEV, kind: "admin", label: "Editor EN" },
  { id: "editor", locale: "ar", path: "/admin/articles/new", origin: DEV, kind: "admin", label: "Editor AR" },
  { id: "settings", locale: "en", path: "/admin/settings", origin: DEV, kind: "admin", label: "Settings EN" },
  { id: "settings", locale: "ar", path: "/admin/settings", origin: DEV, kind: "admin", label: "Settings AR" },
];

const results = {
  generatedAt: new Date().toISOString(),
  servers: { public: PUBLIC, devAdmin: DEV },
  matrix: [],
  screenshots: [],
  issues: [],
  journeys: {},
  performance: { status: "not-run-in-this-script" },
};

function issue(scope, type, detail, severity = "warning") {
  results.issues.push({ scope, type, detail, severity });
}

async function createContext(browser, viewport, adminLocale) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  if (adminLocale) {
    await context.addInitScript((locale) => {
      try { window.localStorage.setItem("dt_admin_locale", locale); } catch {}
    }, adminLocale);
  }
  return context;
}

function attachDiagnostics(page, scope, errors) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      errors.push(`console: ${text}`);
      if (!/favicon/i.test(text)) issue(scope, "console-error", text);
    }
  });
  page.on("pageerror", (error) => {
    const text = error.message || String(error);
    errors.push(`pageerror: ${text}`);
    issue(scope, "page-error", text, "critical");
  });
  page.on("requestfailed", (request) => {
    const text = `${request.method()} ${request.url()} - ${request.failure()?.errorText ?? "failed"}`;
    errors.push(`requestfailed: ${text}`);
    if (!/favicon/i.test(text) && !/google\.com\/maps/i.test(text)) issue(scope, "request-failed", text);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !/favicon/i.test(response.url())) {
      errors.push(`http-${response.status()}: ${response.url()}`);
      issue(scope, `http-${response.status()}`, response.url());
    }
  });
}

async function inspectLayout(page, scope, width) {
  const data = await page.evaluate((viewportWidth) => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;
    const overflow = [];
    const smallTargets = [];
    const brokenImages = [];
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) continue;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      if (element.closest(".sr-only")) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right > vw + 2 || rect.left < -2) {
        overflow.push({
          tag: element.tagName.toLowerCase(),
          cls: (element.className || "").toString().slice(0, 90),
          text: (element.textContent || "").trim().slice(0, 70),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        });
      }
      if (
        viewportWidth <= 768 &&
        element.matches("a, button, input, select, textarea, [role=button]") &&
        !element.hasAttribute("disabled") &&
        (rect.width < 24 || rect.height < 24)
      ) {
        smallTargets.push({
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 60),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
      if (element instanceof HTMLImageElement && element.complete && element.naturalWidth === 0) {
        brokenImages.push(element.currentSrc || element.src);
      }
    }
    return {
      docScrollWidth: doc.scrollWidth,
      clientWidth: vw,
      bodyScrollWidth: document.body.scrollWidth,
      overflow: overflow.slice(0, 12),
      overflowCount: overflow.length,
      smallTargets: smallTargets.slice(0, 12),
      smallTargetCount: smallTargets.length,
      brokenImages: brokenImages.slice(0, 12),
      heading: document.querySelector("h1")?.textContent?.trim().slice(0, 120) ?? null,
      dir: doc.dir,
      lang: doc.lang,
    };
  }, width);

  if (data.docScrollWidth > data.clientWidth + 2) {
    issue(scope, "horizontal-overflow", `document ${data.docScrollWidth}px > viewport ${data.clientWidth}px`, "critical");
  }
  if (data.overflowCount > 0) {
    issue(scope, "element-overflow", `${data.overflowCount} elements outside viewport; first: ${JSON.stringify(data.overflow[0])}`);
  }
  if (data.smallTargetCount > 0) {
    issue(scope, "small-tap-targets", `${data.smallTargetCount} targets under 24px; first: ${JSON.stringify(data.smallTargets[0])}`);
  }
  if (data.brokenImages.length > 0) {
    issue(scope, "broken-images", data.brokenImages.join(", "), "critical");
  }
  return data;
}

function slugifyPage(pageDef, viewport) {
  return `${pageDef.id}-${pageDef.locale}-${viewport.name}`;
}

async function runMatrix(browser) {
  for (const pageDef of pages) {
    for (const viewport of viewports) {
      const scope = `${pageDef.id}/${pageDef.locale}/${viewport.name}`;
      const context = await createContext(browser, viewport, pageDef.kind === "admin" ? pageDef.locale : null);
      const errors = [];
      const page = await context.newPage();
      attachDiagnostics(page, scope, errors);
      const target = `${pageDef.origin}${pageDef.path}`;
      let data = null;
      let screenshot = null;
      try {
        const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForSelector("h1, main", { timeout: 20000 }).catch(() => undefined);
        await page.waitForTimeout(pageDef.kind === "admin" ? 900 : 500);
        await page.evaluate(() => window.scrollTo(0, 0));
        data = await inspectLayout(page, scope, viewport.width);
        if (captureWidths.has(viewport.name)) {
          const file = path.join(shotDir, `${slugifyPage(pageDef, viewport)}.png`);
          await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
          screenshot = path.relative(root, file).replace(/\\/g, "/");
          results.screenshots.push({
            file: screenshot,
            page: pageDef.id,
            locale: pageDef.locale,
            viewport: viewport.name,
            label: pageDef.label,
            url: page.url(),
            heading: data.heading,
          });
        }
        results.matrix.push({
          scope,
          url: page.url(),
          status: response?.status() ?? null,
          dir: data.dir,
          lang: data.lang,
          heading: data.heading,
          docScrollWidth: data.docScrollWidth,
          clientWidth: data.clientWidth,
          overflowCount: data.overflowCount,
          smallTargetCount: data.smallTargetCount,
          errors: errors.length,
          screenshot,
        });
      } catch (error) {
        issue(scope, "navigation-failed", String(error), "critical");
        results.matrix.push({ scope, url: target, error: String(error) });
      } finally {
        await context.close();
      }
    }
  }
}

async function runVisitorJourney(browser) {
  const viewport = { width: 390, height: 844, name: "390" };
  const context = await createContext(browser, viewport);
  const page = await context.newPage();
  const errors = [];
  attachDiagnostics(page, "journey/visitor", errors);
  const journey = { locale: "en", steps: [], status: "running", errors };
  results.journeys.visitor = journey;

  async function step(name, fn) {
    try {
      const value = await fn();
      journey.steps.push({ name, ok: true, ...(value || {}) });
    } catch (error) {
      journey.steps.push({ name, ok: false, error: String(error) });
      throw error;
    }
  }

  try {
    await step("homepage", async () => {
      await page.goto(`${PUBLIC}/en`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      return { url: page.url(), heading: await page.locator("h1").first().innerText() };
    });

    await step("mobile-menu-about", async () => {
      const trigger = page.locator("header button[aria-controls]").first();
      await trigger.click();
      await page.screenshot({ path: path.join(shotDir, "journey-visitor-menu-open-en-390.png"), animations: "disabled" });
      await page.getByRole("navigation").last().getByRole("link", { name: /about/i }).click();
      await page.waitForURL("**/en/about");
      return { url: page.url(), heading: await page.locator("h1").first().innerText() };
    });

    await step("browse-blog", async () => {
      const trigger = page.locator("header button[aria-controls]").first();
      await trigger.click();
      await page.getByRole("navigation").last().getByRole("link", { name: /blog/i }).click();
      await page.waitForURL("**/en/blog");
      return { url: page.url(), articles: await page.locator("article, li a[href*='/en/blog/']").count() };
    });

    await step("open-article", async () => {
      const link = page.locator("a[href^='/en/blog/']:visible").first();
      const href = await link.getAttribute("href");
      await link.click();
      await page.waitForURL("**/en/blog/**");
      await page.waitForSelector("h1");
      return { url: page.url(), expected: href, heading: await page.locator("h1").first().innerText() };
    });

    await step("navigate-booking", async () => {
      const trigger = page.locator("header button[aria-controls]").first();
      await trigger.click();
      const cta = page.locator("a[href='/en/book']:visible").last();
      await cta.click();
      await page.waitForURL("**/en/book");
      return { url: page.url(), heading: await page.locator("h1").first().innerText() };
    });

    await step("booking-validation", async () => {
      await page.route("**/api/booking", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, sent: false }) }),
      );
      await page.locator("button[type=submit]").first().click();
      await page.waitForTimeout(200);
      const alerts = await page.locator("[role=alert], .text-red-700").allInnerTexts();
      await page.screenshot({ path: path.join(shotDir, "journey-visitor-booking-validation-en-390.png"), animations: "disabled" });
      return { alerts: alerts.filter(Boolean).slice(0, 8), focused: await page.evaluate(() => document.activeElement?.id ?? null) };
    });

    await step("booking-demo-state", async () => {
      await page.locator("#booking-name").fill("QA Visitor");
      await page.locator("#booking-contact").fill("qa@example.test");
      await page.locator("#booking-time").fill("Tomorrow morning");
      await page.locator("#booking-message").fill("Automated local UI check; no real appointment submitted.");
      const consent = page.locator("#booking-consent");
      if (!(await consent.isChecked())) await consent.check();
      await page.locator("button[type=submit]").first().click();
      await page.waitForTimeout(300);
      const status = await page.locator("[role=status]").last().innerText().catch(() => "");
      await page.screenshot({ path: path.join(shotDir, "journey-visitor-booking-demo-en-390.png"), animations: "disabled" });
      return { status: status.slice(0, 200), networkSubmitted: false };
    });

    journey.status = "passed";
  } catch (error) {
    journey.status = "failed";
    issue("journey/visitor", "journey-failed", String(error), "critical");
  } finally {
    await context.close();
  }
}

async function runAdminJourney(browser) {
  const viewport = { width: 1440, height: 900, name: "1440" };
  const context = await createContext(browser, viewport, "en");
  const page = await context.newPage();
  const errors = [];
  attachDiagnostics(page, "journey/admin", errors);
  const journey = { locale: "en", origin: DEV, steps: [], status: "running", errors };
  results.journeys.admin = journey;

  async function step(name, fn) {
    try {
      const value = await fn();
      journey.steps.push({ name, ok: true, ...(value || {}) });
    } catch (error) {
      journey.steps.push({ name, ok: false, error: String(error) });
      throw error;
    }
  }

  let createdId = null;
  try {
    await step("dashboard", async () => {
      await page.goto(`${DEV}/admin`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 20000 });
      await page.waitForTimeout(700);
      return { url: page.url(), heading: await page.locator("h1").first().innerText() };
    });

    await step("create-article-form", async () => {
      await page.goto(`${DEV}/admin/articles/new`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#title");
      await page.locator("#title").fill("QA Draft Article AR");
      await page.locator("#slug").fill("qa-draft-article-local-test");
      await page.locator("#excerpt").fill("Local QA draft AR");
      await page.locator("#body").fill("Temporary local QA draft AR.");
      await page.locator("#content-tab-en").click();
      await page.locator("#title").fill("QA Draft Article EN");
      await page.locator("#slug").fill("qa-draft-article-local-test");
      await page.locator("#excerpt").fill("Local QA draft; removed after the test.");
      await page.locator("#body").fill("Temporary local QA draft. No medical claims are made.");
      return { dirtyBadge: await page.locator("text=/unsaved/i").first().isVisible().catch(() => false) };
    });

    await step("preview-unsaved", async () => {
      const previewButton = page.getByRole("button", { name: /preview/i }).first();
      await previewButton.click();
      await page.waitForSelector("#unsaved-preview-title", { timeout: 10000 });
      const title = await page.locator("#unsaved-preview-title").innerText();
      await page.screenshot({ path: path.join(shotDir, "journey-admin-editor-preview-en-1440.png"), animations: "disabled" });
      await page.keyboard.press("Escape");
      return { title };
    });

    await step("unsaved-navigation-warning", async () => {
      page.once("dialog", async (dialog) => {
        journey.dialogMessage = dialog.message();
        await dialog.dismiss();
      });
      await page.locator("nav a[href='/admin/articles']").first().click();
      await page.waitForTimeout(400);
      return { stayedOnEditor: page.url().includes("/admin/articles/new"), dialog: journey.dialogMessage ?? null };
    });

    await step("save-draft", async () => {
      await page.locator("form button[type=submit]").first().click();
      await page.waitForFunction(() => !window.location.pathname.endsWith("/new"), null, { timeout: 30000 });
      createdId = page.url().split("/").pop();
      return { url: page.url(), id: createdId };
    });

    await step("navigate-sections", async () => {
      const visited = [];
      for (const href of ["/admin/articles", "/admin/settings", "/admin"]) {
        await page.locator(`nav a[href='${href}']`).first().click();
        await page.waitForURL(`**${href}`);
        await page.waitForTimeout(300);
        visited.push({ href, heading: await page.locator("h1").first().innerText() });
      }
      return { visited };
    });

    journey.status = "passed";
  } catch (error) {
    journey.status = "failed";
    issue("journey/admin", "journey-failed", String(error), "critical");
  } finally {
    journey.createdArticleId = createdId;
    await context.close();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function writeGallery() {
  const cards = results.screenshots
    .map(
      (shot) => `<article class="card"><div class="meta"><strong>${escapeHtml(shot.label)}</strong><span>${escapeHtml(shot.locale.toUpperCase())} - ${escapeHtml(shot.viewport)}px</span></div><a href="${escapeHtml(shot.file)}"><img loading="lazy" src="${escapeHtml(shot.file)}" alt="${escapeHtml(shot.label)} at ${escapeHtml(shot.viewport)}px"></a><p class="url">${escapeHtml(shot.url)}</p></article>`,
    )
    .join("\n");
  const issueRows = results.issues
    .slice(0, 60)
    .map(
      (item) => `<tr><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.scope)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.detail)}</td></tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dr. Tariq - Visual QA Gallery</title>
<style>
:root{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a;background:#f8fafc}body{margin:0;padding:28px}h1{font-size:1.6rem;margin:0 0 6px}p.lead{color:#475569;margin:0 0 24px}
nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}nav a{background:#fff;border:1px solid #cbd5e1;border-radius:999px;padding:8px 14px;color:#0f172a;text-decoration:none;font-size:.9rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:18px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px #0f172a0d}
.card img{display:block;width:100%;height:auto;border-bottom:1px solid #e2e8f0;background:#f1f5f9}.meta{display:flex;justify-content:space-between;gap:10px;padding:12px 14px 6px;font-size:.85rem}.meta span{color:#64748b;white-space:nowrap}.url{font-size:.72rem;color:#64748b;padding:0 14px 12px;margin:0;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:.82rem}td,th{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top}th{background:#f1f5f9}section{margin-top:36px}h2{font-size:1.15rem}
</style></head><body>
<h1>Dr. Tariq - Real browser visual QA</h1>
<p class="lead">Generated ${escapeHtml(results.generatedAt)} from actual Chromium renders - ${results.screenshots.length} screenshots - ${results.matrix.length} viewport checks - ${results.issues.length} findings.</p>
<nav><a href="#shots">Screenshots</a><a href="#findings">Findings</a><a href="report.json">JSON report</a></nav>
<section id="shots"><h2>Screenshots</h2><div class="grid">${cards}</div></section>
<section id="findings"><h2>Findings</h2><table><thead><tr><th>Severity</th><th>Scope</th><th>Type</th><th>Detail</th></tr></thead><tbody>${issueRows || "<tr><td colspan=4>No findings</td></tr>"}</tbody></table></section>
</body></html>`;
  await writeFile(path.join(artifactDir, "gallery.html"), html, "utf8");
}

async function main() {
  await mkdir(shotDir, { recursive: true });
  const articlesPath = path.join(root, "content", "articles.json");
  const articleBackup = await readFile(articlesPath, "utf8");
  const browser = await chromium.launch({ headless: true });
  try {
    await runMatrix(browser);
    await runVisitorJourney(browser);
    await runAdminJourney(browser);
  } finally {
    await browser.close();
    await writeFile(articlesPath, articleBackup, "utf8");
    results.dataRestored = true;
  }
  await writeFile(path.join(artifactDir, "report.json"), JSON.stringify(results, null, 2), "utf8");
  await writeGallery();
  console.log(
    JSON.stringify(
      {
        matrix: results.matrix.length,
        screenshots: results.screenshots.length,
        issues: results.issues.length,
        critical: results.issues.filter((item) => item.severity === "critical").length,
        visitor: results.journeys.visitor?.status,
        admin: results.journeys.admin?.status,
        adminCreatedId: results.journeys.admin?.createdArticleId,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
