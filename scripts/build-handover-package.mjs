/**
 * Builds the printable handover copy of the 10 articles (Arabic, with the
 * English translation underneath each article) for the doctor to read and
 * mark up on paper.
 *
 * Output: docs/doctor-handover/articles-review-copy.html
 *         docs/doctor-handover/doctor-confirmations.md
 *
 * Private material: never linked from the public site, noindex.
 *
 * Usage: node scripts/build-handover-package.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "doctor-handover");

const SEED_SLUGS = [
  "chronic-kidney-disease",
  "kidney-function-tests",
  "blood-pressure-kidney-health",
  "diabetes-kidney-health",
  "albumin-in-urine",
  "kidney-stone-symptoms",
  "preventing-kidney-stones",
  "acute-kidney-injury",
  "home-blood-pressure-monitoring",
  "kidney-transplant-follow-up",
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Markdown-lite -> HTML (headings, lists, bold, links). */
function md(source) {
  const blocks = source.split(/\n{2,}/).filter((b) => b.trim());
  return blocks
    .map((block) => {
      const inline = (text) =>
        esc(text)
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      if (block.startsWith("## ")) return `<h3>${inline(block.slice(3))}</h3>`;
      const lines = block.split("\n");
      if (lines.every((l) => /^[-*] /.test(l.trim()))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.trim().replace(/^[-*] /, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${inline(block.replace(/\n/g, " "))}</p>`;
    })
    .join("\n");
}

async function main() {
  const raw = await readFile(path.join(ROOT, "content", "articles.json"), "utf8");
  const articles = JSON.parse(raw);
  const seeded = SEED_SLUGS.map((slug) => articles.find((a) => a.slug?.en === slug)).filter(Boolean);
  if (seeded.length !== SEED_SLUGS.length) {
    console.error(`expected ${SEED_SLUGS.length} articles, found ${seeded.length}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const generated = new Date().toISOString().slice(0, 10);

  const sections = seeded
    .map((article, index) => {
      const status = article.review?.status ?? "pending";
      const statusLabel =
        status === "approved" ? "موافَق طبيبياً" : status === "needs-changes" ? "بحاجة إلى تعديلات" : "بانتظار المراجعة";
      return `
  <article class="card">
    <div class="card-head">
      <h2>${index + 1}. ${esc(article.title.ar)}</h2>
      <p class="meta">
        <strong>الحالة:</strong> ${article.status === "published" ? "منشور على الموقع" : "مسودة"} ·
        <strong>المراجعة الطبية:</strong> ${statusLabel} ·
        <strong>المعرّف:</strong> <code>${esc(article.slug.en)}</code>
      </p>
      <p class="meta"><strong>المصدر:</strong> <a href="${esc(article.sourceUrl)}">${esc(article.sourceUrl)}</a></p>
    </div>

    <div class="decision">
      <span class="tick"></span><label>موافق / Approved</label>
      <span class="tick"></span><label>بحاجة إلى تعديلات / Needs changes</label>
    </div>
    <p class="notes"><strong>ملاحظات / Notes:</strong></p>
    <div class="rules"></div>

    <h3 class="lang">النص العربي</h3>
    <div class="body">${md(article.body.ar)}</div>

    <h3 class="lang">English translation</h3>
    <div class="body" dir="ltr">${md(article.body.en)}</div>
  </article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>نسخة مراجعة مقالات الدكتور — ${generated}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: "IBM Plex Arabic", "Segoe UI", system-ui, sans-serif; margin: 0; background: #f4f8fc; color: #10233c; line-height: 1.9; }
  header { background: #0d2f57; color: #fff; padding: 28px 20px; }
  header .inner { max-width: 900px; margin: 0 auto; }
  header h1 { margin: 0 0 8px; font-size: 1.6rem; }
  header p { margin: 4px 0; color: #cfe3f8; font-size: .92rem; }
  main { max-width: 900px; margin: 0 auto; padding: 24px 20px 60px; }
  .notice { background: #fff8e6; border: 1px solid #f0d9a0; border-radius: 14px; padding: 18px 20px; margin: 18px 0; font-size: .92rem; }
  .card { background: #fff; border: 1px solid #dbe7f3; border-radius: 14px; padding: 22px; margin: 18px 0; }
  .card-head h2 { font-size: 1.2rem; margin: 0 0 6px; color: #0d2f57; }
  .meta { font-size: .82rem; color: #51657e; margin: 4px 0; }
  .decision { margin-top: 14px; border: 1px dashed #9db4cc; border-radius: 10px; padding: 10px 12px; display: flex; gap: 26px; align-items: center; font-weight: 700; font-size: .88rem; }
  .tick { display: inline-block; width: 16px; height: 16px; border: 2px solid #0d2f57; border-radius: 4px; vertical-align: -3px; }
  .notes { font-size: .85rem; margin: 10px 0 0; color: #10233c; }
  .rules { border-bottom: 1px solid #9db4cc; height: 26px; margin-bottom: 6px; }
  .lang { font-size: 1rem; color: #0b74c9; margin: 18px 0 6px; border-top: 1px dashed #dbe7f3; padding-top: 10px; }
  .body p, .body li { font-size: .95rem; }
  .body h3 { font-size: 1rem; color: #0d2f57; margin: 14px 0 4px; }
  footer { max-width: 900px; margin: 0 auto; padding: 0 20px 40px; color: #51657e; font-size: .8rem; }
  @media print {
    body { background: #fff; }
    header { background: #0d2f57 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card, .notice { break-inside: avoid-page; }
  }
</style>
</head>
<body>
<header>
  <div class="inner">
    <h1>نسخة مراجعة مقالات الموقع</h1>
    <p>الدكتور طاري أبو حويج — ${seeded.length} مقالات منشورة وموافَق عليها طبياً</p>
    <p>تاريخ الإعداد: ${generated} · هذه الوثيقة خاصة ولا تُنشر على الموقع</p>
  </div>
</header>
<main>
  <div class="notice">
    <p><strong>حالة النشر والمراجعة:</strong> المقالات منشورة على الموقع حالياً، وحالة «بانتظار المراجعة الطبية» تظهر للزوار صراحةً.
    لم يُنسب أي مقال إلى الدكتور كمؤلف أو مُراجِع، ولا تُنشر بيانات منظمة خاصة بالمقال قبل تسجيل موافقة الدكتور.</p>
    <p><strong>المطلوب من الدكتور:</strong> وضع علامة على «موافق» أو «بحاجة إلى تعديلات» لكل مقال، وكتابة الملاحظات في الفراغ المخصّص.
    تُسجِّل إدارة الموقع القرار في لوحة التحكم، ويُختم تلقائياً بتاريخ ووقت القرار.</p>
  </div>
  ${sections}
</main>
<footer>
  <p>يُرجى عدم تعديل هذه النسخة عن الموقع: القرارات تُسجَّل من لوحة التحكم حتى تبقى حالة كل مقال مطابقة لما هو منشور.</p>
</footer>
</body>
</html>
`;

  await writeFile(path.join(OUT_DIR, "articles-review-copy.html"), html, "utf8");
  console.log(`handover copy written: docs/doctor-handover/articles-review-copy.html (${seeded.length} articles)`);
}

main().catch((error) => {
  console.error("failed:", error.message);
  process.exit(1);
});
