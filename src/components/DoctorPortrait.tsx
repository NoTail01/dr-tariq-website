import Image from "next/image";

/**
 * Authentic portrait of the doctor (client-supplied photograph).
 *
 * The original file is served unmodified; the browser picks a suitable
 * derivative through `sizes` + next/image optimization. The crop keeps the
 * head visible on every breakpoint (object-position biased to the top) in
 * both LTR and RTL layouts.
 */
export default function DoctorPortrait({
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 90vw",
}: {
  /** Accessible, already-localized alt text. */
  alt: string;
  className?: string;
  /** Above-the-fold portraits should load eagerly. */
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src="/images/dr-tariq-portrait.png"
      alt={alt}
      width={1200}
      height={960}
      sizes={sizes}
      priority={priority}
      className={`h-full w-full rounded-2xl object-cover object-[50%_28%] ${className}`}
    />
  );
}
