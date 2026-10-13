import { Fragment, type ReactNode } from "react";
import Link from "next/link";

/**
 * Minimal markdown renderer for article bodies.
 * Supports: paragraphs, "## " headings, "- " lists, **bold** text and
 * [text](url) links. No HTML injection is possible: every piece of text is
 * rendered as text and links become real React elements.
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
          <Link key={`${keyPrefix}-l${index}`} href={href} className="font-semibold text-brand-700 underline">
            {label}
          </Link>,
        );
      } else if (href) {
        nodes.push(
          <a
            key={`${keyPrefix}-a${index}`}
            href={href}
            className="font-semibold text-brand-700 underline"
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

export default function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  return (
    <div className="article-body text-ink-700">
      {blocks.map((block, index) => {
        const key = `blk-${index}`;

        if (block.startsWith("## ")) {
          return (
            <h2 key={key}>{renderInline(block.slice(3), key)}</h2>
          );
        }

        const lines = block.split("\n");
        if (lines.every((line) => /^[-*] /.test(line.trim()))) {
          return (
            <ul key={key}>
              {lines.map((line, li) => (
                <li key={`${key}-li${li}`}>{renderInline(line.trim().replace(/^[-*] /, ""), `${key}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={key}>{renderInline(block.replace(/\n/g, " "), key)}</p>;
      })}
    </div>
  );
}
