import Link from "next/link";

import Reveal from "@/components/Reveal";

/** Simple page/section heading with consistent hierarchy. */
export function SectionHeading({
  kicker,
  title,
  intro,
  align = "start",
  as: Tag = "h2",
}: {
  kicker?: string;
  title: string;
  intro?: string;
  align?: "start" | "center";
  as?: "h1" | "h2";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {kicker ? (
        <p className="text-xs font-bold tracking-widest text-brand-600 uppercase">{kicker}</p>
      ) : null}
      <Tag
        className={`mt-2 font-bold text-navy-900 break-words-safe ${
          Tag === "h1" ? "text-3xl leading-tight sm:text-5xl" : "text-2xl leading-snug sm:text-3xl"
        }`}
      >
        {title}
      </Tag>
      {intro ? <p className="mt-4 leading-relaxed text-ink-500">{intro}</p> : null}
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
  tone = "white",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "white" | "soft" | "navy";
}) {
  const toneClass =
    tone === "soft" ? "bg-brand-50/60" : tone === "navy" ? "bg-navy-900 text-white" : "bg-white";

  return (
    <section id={id} className={`${toneClass} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  text,
  actionLabel,
  actionHref,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/70 p-8 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mx-auto h-9 w-9 text-brand-500"
      >
        <path d="M20 12a8 8 0 1 1-8-8" strokeLinecap="round" />
        <path d="M12 8v4l3 2" strokeLinecap="round" />
      </svg>
      <h3 className="mt-4 text-lg font-bold text-navy-900 break-words-safe">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500 break-words-safe">{text}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Final call-to-action band. */
export function CtaBand({
  title,
  text,
  actionLabel,
  actionHref,
}: {
  title: string;
  text: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Section tone="navy">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-white break-words-safe sm:text-3xl">{title}</h2>
        <p className="mt-4 leading-relaxed text-brand-100/85">{text}</p>
        <Link
          href={actionHref}
          className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-sm font-bold text-navy-900 transition-transform hover:-translate-y-0.5 hover:bg-brand-50"
        >
          {actionLabel}
        </Link>
      </Reveal>
    </Section>
  );
}
