import { Fragment, type ReactNode } from "react";
import Link from "next/link";

/**
 * Minimal markdown renderer for article bodies.
 * Supports: paragraphs, "## " headings, "- " lists, **bold** text and
 * [text](url) links. No HTML injection is possible: every piece of text is
 * rendered as text and links become real React elements.
 *
 * Presentation rules that do not alter the text:
 *  - a paragraph consisting only of bold text is an editorial notice
 *    (the "general educational content" line) and is shown in a callout;
 *  - the block that follows an urgent-care heading is tinted so a reader
 *    skimming for "when should I seek care quickly?" cannot miss it.
 */

/** Link targets are restricted to internal paths and safe outbound schemes. */
function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed; // internal route
  if (/^https:\/\/(wa\.me|www\.google\.com)\//.test(trimmed)) return trimmed;
  if (/^tel:\+?[\d]+$/.test(trimmed)) return trimmed;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return null;
}

function renderLinks(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/g);
  const nodes: ReactNode[] = [];
  for (let index = 0; index < parts.length; index += 3) {
    const before = parts[index] ?? "";
    const label = parts[index + 1];
    const url = parts[index + 2];
    if (before) nodes.push(<Fragment key={`${keyPrefix}-t${index}`}>{before}</Fragment>);
    if (label !== undefined && url !== undefined) {
      const href = safeHref(url);
      if (href && href.startsWith("/")) {
        nodes.push(
          <Link
            key={`${keyPrefix}-l${index}`}
            href={href}
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            {label}
          </Link>,
        );
      } else if (href) {
        nodes.push(
          <a
            key={`${keyPrefix}-a${index}`}
            href={href}
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            {...(href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {label}
          </a>,
        );
      } else {
        // Unsafe target: render the label as plain text, never a link.
        nodes.push(<Fragment key={`${keyPrefix}-u${index}`}>{label}</Fragment>);
      }
    }
  }
  return nodes;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Bold first, then links inside each text segment.
  const parts = text.split(/\*\*(.+?)\*\*/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 1) {
      nodes.push(<strong key={`${keyPrefix}-b${index}`}>{part}</strong>);
    } else {
      nodes.push(...renderLinks(part, `${keyPrefix}-${index}`));
    }
  });
  return nodes;
}

/** True when the whole paragraph is one bold run (an editorial notice). */
function isBoldOnly(block: string): boolean {
  const trimmed = block.trim();
  return /^\*\*[^*]+\*\*$/.test(trimmed);
}

/** Headings that introduce urgent-care guidance, in Arabic and English. */
const URGENT_PATTERN =
  /(رعاية عاجلة|عاجل|طارئ|طوارئ|بسرعة|urgent|emergency|seek care|immediately|care quickly)/i;

/** Stable, URL-safe id for a heading (Arabic letters are kept as-is). */
function headingId(text: string, index: number): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `section-${index}-${slug || "heading"}`;
}

/** Plain-text version of a heading, for the table of contents. */
function headingText(block: string): string {
  return block
    .slice(3)
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

export type MarkdownHeading = { id: string; text: string };

/** Headings of a body, used to build the table of contents. */
export function extractHeadings(source: string): MarkdownHeading[] {
  const blocks = source.split(/\n{2,}/).filter((block) => block.trim().length > 0);
  const headings: MarkdownHeading[] = [];
  blocks.forEach((block, index) => {
    if (block.startsWith("## ")) {
      headings.push({ id: headingId(block.slice(3), index), text: headingText(block) });
    }
  });
  return headings;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  // Track the index of the heading we are under so the block that follows an
  // urgent-care heading can be tinted.
  // Which heading each block sits under is derived up front, so rendering
  // stays pure (no mutable state during render).
  const owners: boolean[] = [];
  let urgent = false;
  for (const block of blocks) {
    if (block.startsWith("## ")) urgent = URGENT_PATTERN.test(headingText(block));
    owners.push(urgent);
  }

  return (
    <div className="article-body text-ink-700">
      {blocks.map((block, index) => {
        const key = `blk-${index}`;
        const urgentSection = owners[index];

        if (block.startsWith("## ")) {
          const text = headingText(block);
          return (
            <h2 key={key} id={headingId(text, index)} className="scroll-mt-24">
              {renderInline(block.slice(3), key)}
            </h2>
          );
        }

        const lines = block.split("\n");
        const isList = lines.every((line) => /^[-*] /.test(line.trim()));

        if (isList) {
          return (
            <ul
              key={key}
              className={urgentSection ? "rounded-xl border-s-4 border-red-300 bg-red-50/60 ps-5" : undefined}
            >
              {lines.map((line, li) => (
                <li key={`${key}-li${li}`}>
                  {renderInline(line.trim().replace(/^[-*] /, ""), `${key}-${li}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (isBoldOnly(block)) {
          return (
            <p
              key={key}
              className="my-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-navy-800"
            >
              {renderInline(block, key)}
            </p>
          );
        }

        return (
          <p
            key={key}
            className={
              urgentSection
                ? "rounded-xl border-s-4 border-red-300 bg-red-50/60 px-4 py-3 text-red-900"
                : undefined
            }
          >
            {renderInline(block.replace(/\n/g, " "), key)}
          </p>
        );
      })}
    </div>
  );
}
