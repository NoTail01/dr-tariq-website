"use client";

import { useState, type FormEvent } from "react";

import {
  validateBooking,
  type BookingErrorKey,
  type BookingErrors,
  type ContactMethod,
} from "@/lib/booking";

type Labels = {
  intro: string;
  requestTitle: string;
  requestText: string;
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
    preferredTime: string;
    preferredTimePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
  };
  validation: Record<BookingErrorKey, string>;
  result: {
    demoTitle: string;
    demoText: string;
    successTitle: string;
    successText: string;
    errorTitle: string;
    errorText: string;
  };
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "demo" }
  | { kind: "success" }
  | { kind: "error" };

const errorClass = "mt-1.5 text-sm font-medium text-red-700";
const inputClass =
  "w-full rounded-xl border border-brand-300 bg-white px-4 py-3 text-navy-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none";

export default function BookForm({ labels }: { labels: Labels }) {
  const [errors, setErrors] = useState<BookingErrors>({});
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [method, setMethod] = useState<ContactMethod>("phone");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      ...data,
      consent: new FormData(form).get("consent") === "yes",
      contactMethod: method,
    };

    const validation = validateBooking(payload);
    if (!validation.ok) {
      setErrors(validation.errors);
      setState({ kind: "idle" });
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

  const fieldError = (key: keyof BookingErrors) =>
    key in errors && errors[key] ? (
      <p className={errorClass} id={`err-${key}`} role="alert">
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
          className="mt-4 rounded-full border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-900"
        >
          ← {labels.requestTitle}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errors._ ? (
        <p className={errorClass} role="alert">
          {labels.validation[errors._ as BookingErrorKey]}
        </p>
      ) : null}

      <div>
        <label htmlFor="booking-name" className="block text-sm font-semibold text-navy-900">
          {labels.fields.name} <span aria-hidden="true">*</span>
        </label>
        <input
          id="booking-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder={labels.fields.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "err-name" : undefined}
          className={`${inputClass} mt-2`}
        />
        {fieldError("name")}
      </div>

      <fieldset className="mt-2">
        <legend className="text-sm font-semibold text-navy-900">
          {labels.fields.contact} <span aria-hidden="true">*</span>
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
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                method === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-brand-300 bg-white text-ink-700 hover:bg-brand-50"
              }`}
            >
              <input
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
        <label htmlFor="booking-contact" className="block text-sm font-semibold text-navy-900">
          {labels.fields.contactValue} <span aria-hidden="true">*</span>
        </label>
        <input
          id="booking-contact"
          name="contactValue"
          type="text"
          required
          placeholder={labels.fields.contactValuePlaceholder}
          aria-invalid={Boolean(errors.contactValue)}
          aria-describedby={errors.contactValue ? "err-contactValue" : undefined}
          className={`${inputClass} mt-2`}
        />
        {fieldError("contactValue")}
      </div>

      <div>
        <label htmlFor="booking-time" className="block text-sm font-semibold text-navy-900">
          {labels.fields.preferredTime}
        </label>
        <input
          id="booking-time"
          name="preferredTime"
          type="text"
          placeholder={labels.fields.preferredTimePlaceholder}
          aria-invalid={Boolean(errors.preferredTime)}
          aria-describedby={errors.preferredTime ? "err-preferredTime" : undefined}
          className={`${inputClass} mt-2`}
        />
        {fieldError("preferredTime")}
      </div>

      <div>
        <label htmlFor="booking-message" className="block text-sm font-semibold text-navy-900">
          {labels.fields.message}
        </label>
        <textarea
          id="booking-message"
          name="message"
          rows={4}
          placeholder={labels.fields.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "err-message" : undefined}
          className={`${inputClass} mt-2 resize-y`}
        />
        {fieldError("message")}
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <label htmlFor="booking-consent" className="flex items-start gap-3 text-sm text-ink-700">
          <input
            id="booking-consent"
            name="consent"
            type="checkbox"
            value="yes"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "err-consent" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#0b74c9]"
          />
          <span>{labels.consent}</span>
        </label>
        {fieldError("consent")}
      </div>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        className="w-full rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {state.kind === "submitting" ? labels.fields.submitting : labels.fields.submit}
      </button>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-bold text-red-800">{labels.result.errorTitle}</p>
          <p className="mt-1 text-sm text-red-700">{labels.result.errorText}</p>
        </div>
      ) : null}
    </form>
  );
}
