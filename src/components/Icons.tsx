type IconProps = { className?: string };

/**
 * Shared icons always render with intrinsic `width`/`height` attributes.
 *
 * A caller may pass only colour or spacing classes (`className="text-brand-600"`),
 * which replaces the default size classes. Without an intrinsic size, an SVG
 * that has a `viewBox` but no width resolves to 100% of its container: inside a
 * flex row it then swallows the available space and squeezes the adjacent text
 * into a one-character column. The attributes below are that safety net; CSS
 * size utilities such as `h-4 w-4` still override them as usual.
 */

export function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function BulletIcon({ className = "h-2 w-2" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" width="8" height="8" className={`${className} shrink-0`}>
      <circle cx="4" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}

export function WarningIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${className} shrink-0`}>
      <path d="M12 3.75 21 19.5H3L12 3.75Z" strokeLinejoin="round" />
      <path d="M12 9.5v4.5" strokeLinecap="round" />
      <circle cx="12" cy="16.75" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
