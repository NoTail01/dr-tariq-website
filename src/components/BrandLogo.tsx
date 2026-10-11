import Image from "next/image";

/**
 * Clinic logo: a faithful crop of the kidney emblem from the supplied brand
 * reference image (`public/images/dr-tariq-brand-reference.png`), plus the
 * doctor's name as real, selectable HTML text.
 *
 * The whole banner is never used as a logo, and the emblem is never
 * re-drawn or approximated. The original reference file is preserved.
 */
export default function BrandLogo({
  name,
  title,
  emblemSrc,
  emblemAlt,
  /** "light" = on dark backgrounds (transparent emblem), "dark" = on light. */
  tone = "dark",
  compact = false,
}: {
  /** Already-localized doctor name — rendered as HTML text. */
  name: string;
  /** Already-localized professional title — rendered as HTML text. */
  title?: string;
  emblemSrc: string;
  emblemAlt: string;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const nameClass =
    tone === "dark" ? "text-navy-900" : "text-white";
  const titleClass =
    tone === "dark" ? "text-ink-500" : "text-brand-100/85";

  return (
    <span className="flex items-center gap-2.5">
      <Image
        src={emblemSrc}
        alt={emblemAlt}
        width={64}
        height={66}
        className={`shrink-0 rounded-lg ${compact ? "h-9 w-auto" : "h-11 w-auto"}`}
        priority
      />
      <span className="flex flex-col leading-tight">
        <span className={`font-bold break-words-safe ${nameClass} ${compact ? "text-sm" : "text-base sm:text-lg"}`}>
          {name}
        </span>
        {title && !compact ? (
          <span className={`mt-0.5 text-[11px] font-medium break-words-safe sm:text-xs ${titleClass}`}>
            {title}
          </span>
        ) : null}
      </span>
    </span>
  );
}
