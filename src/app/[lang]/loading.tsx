/** Route-level loading state for the public site. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-100" />
      <div className="mt-6 h-5 w-full max-w-2xl animate-pulse rounded-lg bg-brand-50" />
      <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-lg bg-brand-50" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-brand-50" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
