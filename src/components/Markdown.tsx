import { Fragment, type ReactNode } from "react";

/**
 * Minimal markdown renderer for article bodies.
 * Supports: paragraphs, "## " headings, "- " lists and **bold** text.
 * No HTML injection is possible: every piece of text is rendered as text.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`${keyPrefix}-b${index}`}>{part}</strong>
    ) : (
      <Fragment key={`${keyPrefix}-t${index}`}>{part}</Fragment>
    ),
  );
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
