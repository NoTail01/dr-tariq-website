/**
 * Clinic location map.
 *
 * Renders the EXACT Google Maps embed supplied by the client (never a
 * generated search URL), beside the supplied address text. The
 * "Open in Google Maps" link targets the same place feature (the embed's
 * `!1s` feature id) — no coordinates are used as verified data and no place
 * ID is invented.
 */
export default function ClinicMap({
  embedUrl,
  placeUrl,
  address,
  heading,
  intro,
  openLabel,
  mapTitle,
  addressLabel,
}: {
  embedUrl: string | null;
  placeUrl: string | null;
  /** Already-localized address text for the current locale. */
  address: string | null;
  heading: string;
  intro: string;
  openLabel: string;
  mapTitle: string;
  addressLabel: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 break-words-safe sm:text-3xl">{heading}</h2>
        <p className="mt-4 leading-relaxed text-ink-500 break-words-safe">{intro}</p>
        {address ? (
          <p className="mt-6 rounded-2xl border border-brand-100 bg-white p-4 text-sm text-ink-700 break-words-safe">
            <span className="block text-xs font-bold tracking-wide text-brand-700 uppercase">
              {addressLabel}
            </span>
            <span className="mt-1.5 block font-semibold text-navy-900">{address}</span>
          </p>
        ) : null}
        {placeUrl ? (
          <a
            href={placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {openLabel}
            <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-[0_20px_60px_-40px_rgba(8,33,63,0.6)]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={mapTitle}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="block h-56 w-full border-0 sm:h-72 lg:h-[26rem]"
          />
        ) : (
          <div className="flex h-56 items-center justify-center p-8 text-center text-sm text-ink-500 sm:h-72 lg:h-[26rem]">
            {mapTitle}
          </div>
        )}
      </div>
    </div>
  );
}
