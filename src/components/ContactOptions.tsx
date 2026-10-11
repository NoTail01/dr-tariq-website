import type { Localized } from "@/lib/article-types";

type Labels = {
  callTitle: string;
  callText: string;
  callAction: string;
  whatsappTitle: string;
  whatsappText: string;
  whatsappAction: string;
  emailTitle: string;
  emailText: string;
  emailAction: string;
  disabledNotice: string;
};

type Contact = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: Localized | null;
  workingHours: Localized | null;
};

const iconClass = "h-6 w-6 text-brand-600";

function ChannelIcon({ kind }: { kind: "phone" | "whatsapp" | "mail" }) {
  const paths: Record<string, React.ReactNode> = {
    phone: (
      <path
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a.75.75 0 0 1-.95.235l-1.942-.777a1.125 1.125 0 0 0-1.297.363l-.724 1.282a1.125 1.125 0 0 1-.32.944C6.36 17.44 3.5 14.5 3.5 10.9V9.75A3 3 0 0 0 .5 6.75Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    whatsapp: (
      <path
        d="M20.5 12a8.5 8.5 0 0 1-12.6 7.35L3.5 20.5l1.2-4.3A8.5 8.5 0 1 1 20.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    mail: (
      <path
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m18 0-9 5.25L3.75 6.75m18 0-7.5 4.28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={iconClass}
    >
      {paths[kind]}
    </svg>
  );
}

function Card({
  title,
  text,
  actionLabel,
  href,
  kind,
  disabledLabel,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  href?: string;
  kind: "phone" | "whatsapp" | "mail";
  disabledLabel: string;
}) {
  const active = Boolean(href);

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-6 transition-colors ${
        active
          ? "border-brand-100 bg-white hover:border-brand-300"
          : "border-dashed border-brand-300 bg-brand-50/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            active ? "bg-brand-100" : "bg-white"
          }`}
        >
          <ChannelIcon kind={kind} />
        </span>
        <h3 className="text-lg font-bold text-navy-900 break-words-safe">{title}</h3>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-500 break-words-safe">{text}</p>

      {active && actionLabel && href ? (
        <a
          href={href}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {actionLabel}
        </a>
      ) : (
        <p className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          <span aria-hidden="true">🔒</span>
          {disabledLabel}
        </p>
      )}
    </div>
  );
}

/**
 * Call / WhatsApp / e-mail options.
 * A channel is only active when a verified address exists in settings;
 * otherwise the card is visibly inactive — no number is ever invented.
 */
export default function ContactOptions({
  contact,
  labels,
}: {
  contact: Contact;
  labels: Labels;
}) {
  const phoneHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : undefined;
  const digits = contact.whatsapp ? contact.whatsapp.replace(/[^\d]/g, "") : null;
  const whatsappHref = digits ? `https://wa.me/${digits}` : undefined;
  const mailHref = contact.email ? `mailto:${contact.email}` : undefined;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        kind="phone"
        title={labels.callTitle}
        text={contact.phone ? contact.phone : labels.callText}
        actionLabel={labels.callAction}
        href={phoneHref}
        disabledLabel={labels.disabledNotice}
      />
      <Card
        kind="whatsapp"
        title={labels.whatsappTitle}
        text={contact.whatsapp ? contact.whatsapp : labels.whatsappText}
        actionLabel={labels.whatsappAction}
        href={whatsappHref}
        disabledLabel={labels.disabledNotice}
      />
      <Card
        kind="mail"
        title={labels.emailTitle}
        text={contact.email ? contact.email : labels.emailText}
        actionLabel={labels.emailAction}
        href={mailHref}
        disabledLabel={labels.disabledNotice}
      />
    </div>
  );
}
