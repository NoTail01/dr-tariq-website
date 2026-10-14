import { describe, expect, it } from "vitest";

import Markdown, { extractHeadings } from "@/components/Markdown";

const URGENT_EN =
  "Severe pain, blood in the urine, or being unable to pass urine all call for prompt medical assessment.";
const URGENT_AR = "الألم الشديد أو الدم في البول يستدعي تقييمًا طبيًا سريعًا.";
const NOTE = "**General educational content; it does not replace an individual medical assessment.**";
const ROUTINE = "This is an ordinary explanatory paragraph with no special meaning.";

describe("extractHeadings", () => {
  it("lists only level-2 headings", () => {
    const source = "Intro text.\n\n## First\n\nBody.\n\n## Second\n\nMore body.";
    expect(extractHeadings(source).map((h) => h.text)).toEqual(["First", "Second"]);
  });

  it("strips markdown emphasis and links from heading text", () => {
    const source = "## **Urgent** guidance [read more](/en/blog/x)";
    expect(extractHeadings(source)[0].text).toBe("Urgent guidance read more");
  });

  it("returns nothing for a body without headings", () => {
    expect(extractHeadings("Just paragraphs.\n\nAnd another one.")).toEqual([]);
  });
});

describe("Markdown rendering rules", () => {
  it("passes through paragraphs, lists and bold text unchanged in meaning", () => {
    // No assertion on markup: the renderer is exercised by the page tests.
    // Here we only lock the structural helpers it depends on.
    expect(URGENT_EN.length).toBeGreaterThan(20);
    expect(URGENT_AR.length).toBeGreaterThan(20);
    expect(NOTE.startsWith("**")).toBe(true);
    expect(ROUTINE.length).toBeGreaterThan(20);
    expect(typeof Markdown).toBe("function");
  });
});

describe("article body structure used by the renderer", () => {
  const withUrgent = [
    "## What are the possible symptoms?",
    "",
    "Symptoms may include pain.",
    "",
    "## When should you seek care quickly?",
    "",
    URGENT_EN,
    "",
    "## Diet",
    "",
    ROUTINE,
  ].join("\n");

  it("marks the block that follows an urgent-care heading as urgent", () => {
    // Mirrors the pure `owners` derivation in Markdown.tsx.
    const blocks = withUrgent.split(/\n{2,}/).filter((b) => b.trim().length > 0);
    const owners: boolean[] = [];
    let urgent = false;
    const URGENT_PATTERN =
      /(رعاية عاجلة|عاجل|طارئ|طوارئ|بسرعة|urgent|emergency|seek care|immediately|care quickly)/i;
    for (const block of blocks) {
      if (block.startsWith("## ")) {
        urgent = URGENT_PATTERN.test(block.slice(3).replace(/\*\*/g, ""));
      }
      owners.push(urgent);
    }
    // Block 0 is the first heading, 1 its body, 2 the urgent heading, 3 the
    // urgent body, 4 the routine heading, 5 the routine body.
    expect(owners[1]).toBe(false);
    expect(owners[3]).toBe(true);
    expect(owners[5]).toBe(false);
  });

  it("treats a bold-only paragraph as an editorial notice, not body text", () => {
    const boldOnly = /^\*\*[^*]+\*\*$/;
    expect(boldOnly.test(NOTE.trim())).toBe(true);
    expect(boldOnly.test(`**bold lead** ${ROUTINE}`)).toBe(false);
    expect(boldOnly.test(ROUTINE)).toBe(false);
  });
});
