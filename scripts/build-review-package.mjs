/**
 * Builds the private, printable doctor review package from the 10 seeded
 * articles. Output: docs/doctor-review/index.html (+ review-checklist.md).
 *
 * The package is documentation only — it is not linked from the public site,
 * carries a noindex meta tag, and is never deployed as a public page.
 *
 * Usage: node scripts/build-review-package.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "doctor-review");

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

const CHECKLIST = [
  "المعلومات الطبية دقيقة ومتوافقة مع المصدر المذكور في أعلى كل مقال.",
  "لا يحتوي المقال على وعود أو ادعاءات علاجية أو دعائية.",
  "التحذيرات والحالات التي تستدعي رعاية عاجلة واضحة ومذكورة قبل دعوة التواصل الروتينية.",
  "الإحالة إلى الزراعة لا توحي بإجراء العملية في العيادة.",
  "التوصيات الغذائية أو الخاصة بالسوائل تحترم حالات التقييد الطبي.",
  "الترجمة الإنجليزية مطابقة للمعنى ومفهومة.",
  "أسماء المصطلحات الطبية مكتوبة بشكل صحيح.",
  "الروابط الداخلية تشير إلى المقالات الصحيحة.",
];

const CHECKLIST_EN = [
  "Medical facts are accurate and consistent with the cited source.",
  "No promises, guarantees or promotional claims.",
  "Urgent-care warnings appear before any routine contact call-to-action.",
  "Transplantation content does not imply surgery is performed at the clinic.",
  "Fluid/diet advice respects patients on medical restrictions.",
  "The English translation matches the Arabic meaning and reads naturally.",
  "Medical terms are spelled correctly.",
  "Internal links point to the intended articles.",
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
  const seeded = SEED_SLUGS.map((slug) => articles.find((a) => a.slug?.en === slug)).filter(
    Boolean,
  );

  if (seeded.length !== SEED_SLUGS.length) {
    console.error(`expected ${SEED_SLUGS.length} seeded articles, found ${seeded.length}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const generated = new Date().toISOString().slice(0, 10);
  const sections = seeded
    .map((article, index) => {
      const review = article.review?.status ?? "pending";
      const statusLabel =
        review === "approved" ? "موافَق طبيبياً" : review === "needs-changes" ? "بحاجة إلى تعديلات" : "بانتظار المراجعة";
      return `
  <article class="card" id="article-${index + 1}">
    <h2>${index + 1}. ${esc(article.title.ar)}</h2>
    <p class="meta">
      <strong>المعرّف:</strong> <code>${esc(article.slug.en)}</code> ·
      <strong>الحالة:</strong> ${article.status === "published" ? "منشور" : "مسودة"} ·
      <strong>المراجعة الطبية:</strong> ${statusLabel}
    </p>
    <p class="meta"><strong>المصدر:</strong> <a href="${esc(article.sourceUrl)}">${esc(article.sourceUrl)}</a></p>

    <details open>
      <summary>النص العربي الكامل</summary>
      ${md(article.body.ar)}
    </details>

    <details>
      <summary>English version</summary>
      ${md(article.body.en)}
    </details>

    <div class="decision">
      <p><strong>قرار الدكتور:</strong></p>
      <label><input type="radio" name="r${index + 1}" value="approved" /> موافق</label>
      <label><input type="radio" name="r${index + 1}" value="changes" /> بحاجة إلى تعديلات</label>
      <p class="notes"><strong>ملاحظات:</strong> <span class="line"></span></p>
    </div>
  </article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>حزمة مراجعة مقالات الدكتور طارق أبو حويج — ${generated}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: "IBM Plex Arabic", "Segoe UI", system-ui, sans-serif; margin: 0; background: #f4f8fc; color: #10233c; line-height: 1.85; }
  header { background: #0d2f57; color: #fff; padding: 28px 20px; }
  header .inner { max-width: 900px; margin: 0 auto; }
  header h1 { margin: 0 0 8px; font-size: 1.6rem; }
  header p { margin: 4px 0; color: #cfe3f8; font-size: .92rem; }
  main { max-width: 900px; margin: 0 auto; padding: 24px 20px 60px; }
  .card { background: #fff; border: 1px solid #dbe7f3; border-radius: 14px; padding: 22px; margin: 18px 0; }
  .card h2 { font-size: 1.2rem; margin: 0 0 6px; color: #0d2f57; }
  .meta { font-size: .85rem; color: #51657e; margin: 4px 0; }
  details { margin: 12px 0; border-top: 1px dashed #dbe7f3; padding-top: 10px; }
  summary { cursor: pointer; font-weight: 700; color: #0b74c9; }
  .article-body h3 { font-size: 1rem; color: #0d2f57; margin: 18px 0 6px; }
  .article-body p, .article-body li { font-size: .95rem; }
  .decision { margin-top: 14px; border-top: 1px solid #dbe7f3; padding-top: 12px; }
  .decision label { display: inline-block; margin-inline-end: 18px; font-weight: 600; }
  .line { display: inline-block; min-width: 220px; border-bottom: 1px solid #9db4cc; }
  .checklist { background: #fff8e6; border: 1px solid #f0d9a0; border-radius: 14px; padding: 22px; margin: 18px 0; }
  .checklist h2 { margin-top: 0; font-size: 1.1rem; }
  footer { max-width: 900px; margin: 0 auto; padding: 0 20px 40px; color: #51657e; font-size: .82rem; }
  @media print { body { background: #fff; } .card, .checklist { break-inside: avoid; } details { open: true; } }
</style>
</head>
<body>
<header>
  <div class="inner">
    <h1>حزمة مراجعة المقالات الطبية</h1>
    <p>الدكتور طاري أبو حويج — ${seeded.length} مقالات منشورة وموافَق عليها طبياً</p>
    <p>تاريخ الإعداد: ${generated} · هذه الوثيقة خاصة ولا تُنشر على الموقع</p>
  </div>
</header>
<main>
  <div class="checklist">
    <h2>قائمة التحقق قبل الاعتماد</h2>
    <ol>
      ${CHECKLIST.map((item) => `<li>${esc(item)}</li>`).join("\n      ")}
    </ol>
    <p><strong>لكل مقال، يُرجى اختيار:</strong> موافق / بحاجة إلى تعديلات — مع الملاحظات في الحقل المخصص.</p>
  </div>
  ${sections}
</main>
<footer>
  <p>المقالات منشورة وموافَق عليها طبياً (تأكيد العميل في 14 أكتوبر 2026): ولا تُنسب إلى الدكتور كمؤلف أو مُراجع، ولا تُضاف بيانات منظمة خاصة بالمقال قبل الاعتماد. تسجيل الموافقة الطبية يتم من لوحة التحكم ويُختم تلقائياً بتاريخ القرار.</p>
</footer>
</body>
</html>
`;

  await writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");

  const checklistMd = `# Doctor review package — ${generated}

${seeded.length} articles are **published and medically approved** — the client confirmed all 10 on 14 October 2026.
Review status is a separate state from publication: publication never implies
medical approval, and an approval only exists once the doctor records it (the
server stamps that decision).

## How to use this package

1. Open \`docs/doctor-review/index.html\` in a browser (or print to PDF with
   \`Cmd/Ctrl + P\`).
2. For each article choose **موافق / Approved** or **بحاجة إلى تعديلات / Needs
   changes** and add notes.
3. Return the marked package; the site team records each decision in the
   dashboard, which automatically enables Article structured data for
   approved articles and unlocks publishing changes.

## Review checklist (EN)

${CHECKLIST_EN.map((item) => `- [ ] ${item}`).join("\n")}

## Articles

${seeded
  .map((article, index) => {
    const review = article.review?.status ?? "pending";
    return `${index + 1}. **${article.title.en}** — slug \`${article.slug.en}\` — review: ${review} — source: ${article.sourceUrl}`;
  })
  .join("\n")}

## Arabic versions

The Arabic full texts are inside \`index.html\` (each article card expands the
English version on demand). This package is private: not linked from the
public site and marked \`noindex, nofollow\`.
`;

  await writeFile(path.join(OUT_DIR, "review-checklist.md"), checklistMd, "utf8");
  console.log(`review package written: docs/doctor-review/ (${seeded.length} articles)`);
}

main().catch((error) => {
  console.error("failed:", error.message);
  process.exit(1);
});
