/** Clearly marked development placeholder — never used for real photos. */
export function DevBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
      <span aria-hidden="true">⚠</span>
      {label}
    </span>
  );
}

type PlaceholderImageProps = {
  /** Accessible alt text (already localized). */
  alt: string;
  /** Visible note explaining what is missing. */
  note: string;
  badgeLabel: string;
  className?: string;
  /** e.g. "aspect-[4/5] w-full" */
  aspect?: string;
};

/**
 * Frame shown where an authentic photo is still missing.
 * Deliberately not a stock photo: it states what is missing.
 */
export function PlaceholderImage({
  alt,
  note,
  badgeLabel,
  className = "",
  aspect = "aspect-[4/5]",
}: PlaceholderImageProps) {
  return (
    <figure className={className}>
      <div
        role="img"
        aria-label={alt}
        className={`${aspect} relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-6 text-center`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-10 w-10 text-brand-500"
        >
          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
        </svg>
        <DevBadge label={badgeLabel} />
      </div>
      <figcaption className="mt-3 text-sm text-ink-500">{note}</figcaption>
    </figure>
  );
}
