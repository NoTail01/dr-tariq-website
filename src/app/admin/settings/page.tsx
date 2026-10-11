"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiGet, apiSend } from "@/components/admin/api";
import type { Settings } from "@/lib/settings";

type SettingsResponse = { ok: boolean; settings: Settings };

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none";

function TextField({
  label,
  value,
  onChange,
  dir,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "rtl" | "ltr";
  hint?: string;
  type?: string;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-navy-900">
        {label}
      </label>
      <input
        id={id}
        type={type}
        dir={dir}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<SettingsResponse>("/api/admin/settings")
      .then((data) => setSettings(data.settings))
      .catch(() => setError("Settings are unavailable. Check that you are signed in."));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      const data = await apiSend<{ ok: boolean; settings: Settings }>(
        "PATCH",
        "/api/admin/settings",
        settings,
      );
      setSettings(data.settings);
      setNotice("Settings saved.");
    } catch (caught) {
      const apiError = caught as { errors?: Record<string, string> };
      setError(apiError.errors ? Object.values(apiError.errors).join(" ") : "Could not save the settings.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const update = (patch: Partial<Settings>) => setSettings((current) => ({ ...current!, ...patch }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Site settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Empty contact fields stay inactive on the website — no number or address is ever
          invented.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">Identity</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField
            label="Site name (AR)"
            dir="rtl"
            value={settings.siteName.ar}
            onChange={(value) => update({ siteName: { ...settings.siteName, ar: value } })}
          />
          <TextField
            label="Site name (EN)"
            dir="ltr"
            value={settings.siteName.en}
            onChange={(value) => update({ siteName: { ...settings.siteName, en: value } })}
          />
          <TextField
            label="Tagline (AR)"
            dir="rtl"
            value={settings.tagline.ar}
            onChange={(value) => update({ tagline: { ...settings.tagline, ar: value } })}
          />
          <TextField
            label="Tagline (EN)"
            dir="ltr"
            value={settings.tagline.en}
            onChange={(value) => update({ tagline: { ...settings.tagline, en: value } })}
          />
          <TextField
            label="Footer note (AR)"
            dir="rtl"
            value={settings.footerNote.ar}
            onChange={(value) => update({ footerNote: { ...settings.footerNote, ar: value } })}
          />
          <TextField
            label="Footer note (EN)"
            dir="ltr"
            value={settings.footerNote.en}
            onChange={(value) => update({ footerNote: { ...settings.footerNote, en: value } })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          Contact — verified details only
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <TextField
            label="Phone"
            dir="ltr"
            type="tel"
            value={settings.contact.phone ?? ""}
            onChange={(value) => update({ contact: { ...settings.contact, phone: value || null } })}
            hint="Leave empty until the clinic confirms it."
          />
          <TextField
            label="WhatsApp"
            dir="ltr"
            type="tel"
            value={settings.contact.whatsapp ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, whatsapp: value || null } })
            }
            hint="Digits only, with country code."
          />
          <TextField
            label="Email"
            dir="ltr"
            type="email"
            value={settings.contact.email ?? ""}
            onChange={(value) => update({ contact: { ...settings.contact, email: value || null } })}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            label="Address (AR)"
            dir="rtl"
            value={settings.contact.address?.ar ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  address: value
                    ? { ar: value, en: settings.contact.address?.en ?? "" }
                    : null,
                },
              })
            }
          />
          <TextField
            label="Address (EN)"
            dir="ltr"
            value={settings.contact.address?.en ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  address: value
                    ? { ar: settings.contact.address?.ar ?? "", en: value }
                    : null,
                },
              })
            }
          />
          <TextField
            label="Working hours (AR)"
            dir="rtl"
            value={settings.contact.workingHours?.ar ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  workingHours: value
                    ? { ar: value, en: settings.contact.workingHours?.en ?? "" }
                    : null,
                },
              })
            }
          />
          <TextField
            label="Working hours (EN)"
            dir="ltr"
            value={settings.contact.workingHours?.en ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  workingHours: value
                    ? { ar: settings.contact.workingHours?.ar ?? "", en: value }
                    : null,
                },
              })
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          Social links (optional)
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {(["facebook", "instagram", "x", "linkedin", "youtube"] as const).map((key) => (
            <TextField
              key={key}
              label={`${key} URL`}
              dir="ltr"
              type="url"
              value={settings.social[key] ?? ""}
              onChange={(value) => update({ social: { ...settings.social, [key]: value || null } })}
            />
          ))}
        </div>
      </section>

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
        >
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
