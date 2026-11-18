"use client";

import { useRef, useState, type FormEvent } from "react";

import {
  firstBookingErrorField,
  validateBooking,
  type BookingErrorKey,
  type BookingErrors,
  type BookingInput,
  type ContactMethod,
} from "@/lib/booking";

type Labels = {
  intro: string;
  requestTitle: string;
  requestText: string;
  requiredField: string;
  formNotice: string;
  privacyNotice: string;
  disabledNotice: string;
  consent: string;
  fields: {
    name: string;
    namePlaceholder: string;
    contact: string;
    contactEmail: string;
    contactPhone: string;
    contactWhatsapp: string;
    contactValue: string;
    contactValuePlaceholder: string;
    contactValuePlaceholderEmail: string;
    contactValuePlaceholderPhone: string;
    contactValuePlaceholderWhatsapp: string;
    contactValueHintEmail: string;
    contactValueHintPhone: string;
    contactValueHintWhatsapp: string;
    preferredTime: string;
    preferredTimePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
  };
  validation: Record<BookingErrorKey, string> & { summary: string };
  result: {
    demoTitle: string;
    demoText: string;
    successTitle: string;
    successText: string;
    errorTitle: string;
    errorText: string;
    retry: string;
  };
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "demo" }
  | { kind: "success" }
  | { kind: "error" };

const errorClass = "mt-1.5 text-sm font-semibold text-red-700";
const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-brand-300 bg-white px-4 py-3 text-base text-navy-900 placeholder:text-ink-300 focus:border-brand-600";
const hintClass = "mt-1.5 text-sm leading-relaxed text-ink-500";

const FIELD_IDS: Record<keyof BookingInput, string> = {
  name: "booking-name",
  contactMethod: "booking-method-phone",
  contactValue: "booking-contact",
  preferredTime: "booking-time",
  message: "booking-message",
  consent: "booking-consent",
};

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function RequiredMark({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true"> *</span>
      <span className="sr-only"> ({label})</span>
    </>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 rtl:rotate-180"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function BookForm({ labels }: { labels: Labels }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [method, setMethod] = useState<ContactMethod>("phone");

  const contactConfig = {
    email: {
      type: "email",
      inputMode: "email" as const,
      autoComplete: "email",
      placeholder: labels.fields.contactValuePlaceholderEmail,
      hint: labels.fields.contactValueHintEmail,
    },
    phone: {
      type: "tel",
      inputMode: "tel" as const,
      autoComplete: "tel",
      placeholder: labels.fields.contactValuePlaceholderPhone,
      hint: labels.fields.contactValueHintPhone,
    },
    whatsapp: {
      type: "tel",
      inputMode: "tel" as const,
      autoComplete: "tel",
      placeholder: labels.fields.contactValuePlaceholderWhatsapp,
      hint: labels.fields.contactValueHintWhatsapp,
    },
  }[method];

  const focusField = (field: keyof BookingInput) => {
    requestAnimationFrame(() => document.getElementById(FIELD_IDS[field])?.focus());
  };

  function retry() {
    setState({ kind: "idle" });
    focusField("name");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      consent: formData.get("consent") === "yes",
      contactMethod: method,
    };

    const validation = validateBooking(payload);
    if (!validation.ok) {
      setErrors(validation.errors);
      setState({ kind: "idle" });
      const first = firstBookingErrorField(validation.errors);
      if (first) focusField(first);
      return;
    }

    setErrors({});
    setState({ kind: "submitting" });

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; sent?: boolean }
        | null;

      if (!response.ok || !body?.ok) {
        setState({ kind: "error" });
        return;
      }

      // Only a real, confirmed submission may show a success message.
      setState(body.sent ? { kind: "success" } : { kind: "demo" });
      if (body.sent) form.reset();
    } catch {
      setState({ kind: "error" });
    }
  }

  const fieldError = (key: keyof BookingInput) =>
    errors[key] ? (
      <p className={errorClass} id={`err-${key}`}>
        {labels.validation[errors[key] as BookingErrorKey]}
      </p>
    ) : null;

  if (state.kind === "success") {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-6" role="status">
        <h3 className="text-lg font-bold text-green-900">{labels.result.successTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-green-800">{labels.result.successText}</p>
      </div>
    );
  }

  if (state.kind === "demo") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6" role="status">
        <h3 className="text-lg font-bold text-amber-900">{labels.result.demoTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-amber-800">{labels.result.demoText}</p>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        >
          <ArrowIcon />
          {labels.requestTitle}
        </button>
      </div>
    );
  }
  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {state.kind === "submitting"
          ? labels.fields.submitting
          : state.kind === "error"
            ? `${labels.result.errorTitle}. ${labels.result.errorText}`
            : ""}
      </p>

      <div aria-live="polite" aria-atomic="true">
        {errors._ ? (
          <p className={errorClass}>{labels.validation[errors._ as BookingErrorKey]}</p>
        ) : Object.keys(errors).length > 0 ? (
          <p className={errorClass}>{labels.validation.summary}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={FIELD_IDS.name} className="block text-sm font-semibold text-navy-900">
          {labels.fields.name}
          <RequiredMark label={labels.requiredField} />
        </label>
        <input
          id={FIELD_IDS.name}
          name="name"
          type="text"
          autoComplete="name"
          maxLength={120}
          required
          placeholder={labels.fields.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy(errors.name && "err-name")}
          className={inputClass}
        />
        {fieldError("name")}
      </div>

      <fieldset
        className="mt-2"
        aria-invalid={Boolean(errors.contactMethod)}
        aria-describedby={describedBy(errors.contactMethod && "err-contactMethod")}
      >
        <legend className="text-sm font-semibold text-navy-900">
          {labels.fields.contact}
          <RequiredMark label={labels.requiredField} />
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["phone", labels.fields.contactPhone],
              ["whatsapp", labels.fields.contactWhatsapp],
              ["email", labels.fields.contactEmail],
            ] as [ContactMethod, string][]
          ).map(([value, text]) => (
            <label
              key={value}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                method === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-brand-300 bg-white text-ink-700 hover:bg-brand-50"
              }`}
            >
              <input
                id={`booking-method-${value}`}
                type="radio"
                name="contactMethod"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="sr-only"
              />
              {text}
            </label>
          ))}
        </div>
        {fieldError("contactMethod")}
      </fieldset>

      <div>
        <label htmlFor={FIELD_IDS.contactValue} className="block text-sm font-semibold text-navy-900">
          {labels.fields.contactValue}
          <RequiredMark label={labels.requiredField} />
        </label>
        <input
          id={FIELD_IDS.contactValue}
          name="contactValue"
          type={contactConfig.type}
          inputMode={contactConfig.inputMode}
          autoComplete={contactConfig.autoComplete}
          maxLength={120}
          required
          spellCheck={false}
          placeholder={contactConfig.placeholder}
          aria-invalid={Boolean(errors.contactValue)}
          aria-describedby={describedBy(
            errors.contactValue && "err-contactValue",
            "booking-contact-hint",
          )}
          className={inputClass}
        />
        <p id="booking-contact-hint" className={hintClass}>
          {contactConfig.hint}
        </p>
        {fieldError("contactValue")}
      </div>

      <div>
        <label htmlFor={FIELD_IDS.preferredTime} className="block text-sm font-semibold text-navy-900">
          {labels.fields.preferredTime}
        </label>
        <input
          id={FIELD_IDS.preferredTime}
          name="preferredTime"
          type="text"
          autoComplete="off"
          maxLength={200}
          placeholder={labels.fields.preferredTimePlaceholder}
          aria-invalid={Boolean(errors.preferredTime)}
          aria-describedby={describedBy(errors.preferredTime && "err-preferredTime")}
          className={inputClass}
        />
        {fieldError("preferredTime")}
      </div>

      <div>
        <label htmlFor={FIELD_IDS.message} className="block text-sm font-semibold text-navy-900">
          {labels.fields.message}
        </label>
        <textarea
          id={FIELD_IDS.message}
          name="message"
          rows={4}
          maxLength={2000}
          placeholder={labels.fields.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy(errors.message && "err-message")}
          className={`${inputClass} resize-y`}
        />
        {fieldError("message")}
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <label htmlFor={FIELD_IDS.consent} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink-700">
          <input
            id={FIELD_IDS.consent}
            name="consent"
            type="checkbox"
            value="yes"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy(errors.consent && "err-consent")}
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#0b74c9]"
          />
          <span>{labels.consent}</span>
        </label>
        {fieldError("consent")}
      </div>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {state.kind === "submitting" ? (
          <>
            <Spinner />
            <span>{labels.fields.submitting}</span>
          </>
        ) : (
          labels.fields.submit
        )}
      </button>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-bold text-red-800">{labels.result.errorTitle}</p>
          <p className="mt-1 text-sm text-red-700">{labels.result.errorText}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
          >
            {labels.result.retry}
          </button>
        </div>
      ) : null}
    </form>
  );
}
