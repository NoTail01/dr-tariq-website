"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { apiGet, apiSend } from "@/components/admin/api";
import { useDashboardLocale } from "@/components/admin/useDashboardLocale";
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
  const { t } = useDashboardLocale();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    apiGet<SettingsResponse>("/api/admin/settings")
      .then((data) => {
        setSettings(data.settings);
        setSavedSnapshot(JSON.stringify(data.settings));
      })
      .catch(() => setError(t.common.unavailable));
  }, [t]);

  // Warn before losing unsaved edits on tab close / reload.
  const dirty = Boolean(settings) && JSON.stringify(settings) !== savedSnapshot;
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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
      setSavedSnapshot(JSON.stringify(data.settings));
      setNotice(t.settings.saved);
      formRef.current?.scrollIntoView({ block: "nearest" });
    } catch (caught) {
      const apiError = caught as { errors?: Record<string, string> };
      setError(
        apiError.errors
          ? Object.values(apiError.errors).join(" ")
          : t.common.saveFailed,
      );
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

  const qualifications = settings.doctor.qualifications;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.settings.subtitle}</p>
      </div>

      {/* Unsaved-changes banner — the save button only reports success
          after the server confirms the write. */}
      {dirty ? (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
        >
          ⚠ {t.settings.unsaved} — {t.settings.unsavedHint}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
        >
          ✓ {notice}
        </p>
      ) : null}

      {/* ---------------- Doctor profile ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          {t.settings.doctor}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.settings.doctorHint}</p>

        <div className="mt-4 grid gap-5">
          <div>
            <label htmlFor="bio-ar" className="text-sm font-semibold text-navy-900">
              {t.settings.bioAr}
            </label>
            <textarea
              id="bio-ar"
              dir="rtl"
              rows={6}
              className={`${inputClass} resize-y leading-relaxed`}
              value={settings.doctor.biography.ar}
              onChange={(event) =>
                update({
                  doctor: {
                    ...settings.doctor,
                    biography: { ...settings.doctor.biography, ar: event.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <label htmlFor="bio-en" className="text-sm font-semibold text-navy-900">
              {t.settings.bioEn}
            </label>
            <textarea
              id="bio-en"
              dir="ltr"
              rows={6}
              className={`${inputClass} resize-y leading-relaxed`}
              value={settings.doctor.biography.en}
              onChange={(event) =>
                update({
                  doctor: {
                    ...settings.doctor,
                    biography: { ...settings.doctor.biography, en: event.target.value },
                  },
                })
              }
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-navy-900">{t.settings.qualifications}</p>
            <ul className="mt-3 space-y-3">
              {qualifications.map((qualification, index) => (
                <li key={index} className="rounded-xl border border-slate-200 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`qual-ar-${index}`}
                        className="text-xs font-semibold text-slate-500"
                      >
                        {t.settings.qualificationAr}
                      </label>
                      <input
                        id={`qual-ar-${index}`}
                        dir="rtl"
                        className={inputClass}
                        value={qualification.ar}
                        onChange={(event) => {
                          const next = [...qualifications];
                          next[index] = { ...qualification, ar: event.target.value };
                          update({ doctor: { ...settings.doctor, qualifications: next } });
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`qual-en-${index}`}
                        className="text-xs font-semibold text-slate-500"
                      >
                        {t.settings.qualificationEn}
                      </label>
                      <input
                        id={`qual-en-${index}`}
                        dir="ltr"
                        className={inputClass}
                        value={qualification.en}
                        onChange={(event) => {
                          const next = [...qualifications];
                          next[index] = { ...qualification, en: event.target.value };
                          update({ doctor: { ...settings.doctor, qualifications: next } });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = qualifications.filter((_, i) => i !== index);
                      update({ doctor: { ...settings.doctor, qualifications: next } });
                    }}
                    className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {t.common.remove}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                update({
                  doctor: {
                    ...settings.doctor,
                    qualifications: [...qualifications, { ar: "", en: "" }],
                  },
                })
              }
              className="mt-3 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              + {t.settings.addQualification}
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- Identity ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          {t.settings.identity}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField
            label={t.settings.siteNameAr}
            dir="rtl"
            value={settings.siteName.ar}
            onChange={(value) => update({ siteName: { ...settings.siteName, ar: value } })}
          />
          <TextField
            label={t.settings.siteNameEn}
            dir="ltr"
            value={settings.siteName.en}
            onChange={(value) => update({ siteName: { ...settings.siteName, en: value } })}
          />
          <TextField
            label={t.settings.taglineAr}
            dir="rtl"
            value={settings.tagline.ar}
            onChange={(value) => update({ tagline: { ...settings.tagline, ar: value } })}
          />
          <TextField
            label={t.settings.taglineEn}
            dir="ltr"
            value={settings.tagline.en}
            onChange={(value) => update({ tagline: { ...settings.tagline, en: value } })}
          />
          <TextField
            label={t.settings.footerNoteAr}
            dir="rtl"
            value={settings.footerNote.ar}
            onChange={(value) => update({ footerNote: { ...settings.footerNote, ar: value } })}
          />
          <TextField
            label={t.settings.footerNoteEn}
            dir="ltr"
            value={settings.footerNote.en}
            onChange={(value) => update({ footerNote: { ...settings.footerNote, en: value } })}
          />
        </div>
      </section>

      {/* ---------------- Contact ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          {t.settings.contact}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <TextField
            label={t.settings.mobileNational}
            dir="ltr"
            type="tel"
            value={settings.contact.phone ?? ""}
            onChange={(value) => update({ contact: { ...settings.contact, phone: value || null } })}
            hint={t.settings.mobileIntl}
          />
          <TextField
            label={t.settings.mobileIntl}
            dir="ltr"
            type="tel"
            value={settings.contact.phoneIntl ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, phoneIntl: value || null } })
            }
          />
          <TextField
            label={t.settings.landlineNational}
            dir="ltr"
            type="tel"
            value={settings.contact.landline ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, landline: value || null } })
            }
          />
          <TextField
            label={t.settings.landlineIntl}
            dir="ltr"
            type="tel"
            value={settings.contact.landlineIntl ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, landlineIntl: value || null } })
            }
          />
          <TextField
            label={t.settings.whatsappNumber}
            dir="ltr"
            type="tel"
            value={settings.contact.whatsapp ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, whatsapp: value || null } })
            }
            hint={t.settings.whatsappHint}
          />
          <div className="flex items-center gap-3 self-end pb-1.5">
            <input
              id="whatsapp-enabled"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={settings.contact.whatsappEnabled}
              onChange={(event) =>
                update({
                  contact: { ...settings.contact, whatsappEnabled: event.target.checked },
                })
              }
            />
            <label htmlFor="whatsapp-enabled" className="text-sm font-semibold text-navy-900">
              {t.settings.whatsappEnable}
            </label>
          </div>
          <TextField
            label={t.settings.email}
            dir="ltr"
            type="email"
            value={settings.contact.email ?? ""}
            onChange={(value) => update({ contact: { ...settings.contact, email: value || null } })}
          />
          <TextField
            label={t.settings.whatsappMessageAr}
            dir="rtl"
            value={settings.contact.whatsappMessage?.ar ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  whatsappMessage: {
                    ar: value,
                    en: settings.contact.whatsappMessage?.en ?? "",
                  },
                },
              })
            }
            hint={t.settings.whatsappMessageHint}
          />
          <TextField
            label={t.settings.whatsappMessageEn}
            dir="ltr"
            value={settings.contact.whatsappMessage?.en ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  whatsappMessage: {
                    ar: settings.contact.whatsappMessage?.ar ?? "",
                    en: value,
                  },
                },
              })
            }
            hint={t.settings.whatsappMessageHint}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            label={t.settings.addressAr}
            dir="rtl"
            value={settings.contact.address?.ar ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  address: value ? { ar: value, en: settings.contact.address?.en ?? "" } : null,
                },
              })
            }
          />
          <TextField
            label={t.settings.addressEn}
            dir="ltr"
            value={settings.contact.address?.en ?? ""}
            onChange={(value) =>
              update({
                contact: {
                  ...settings.contact,
                  address: value ? { ar: settings.contact.address?.ar ?? "", en: value } : null,
                },
              })
            }
          />
          <TextField
            label={t.settings.hoursAr}
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
            label={t.settings.hoursEn}
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

      {/* ---------------- Maps ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">{t.settings.maps}</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.settings.mapsHint}</p>
        <div className="mt-4 grid gap-5">
          <TextField
            label={t.settings.mapsEmbed}
            dir="ltr"
            value={settings.contact.mapsEmbedUrl ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, mapsEmbedUrl: value || null } })
            }
          />
          <TextField
            label={t.settings.mapsPlace}
            dir="ltr"
            value={settings.contact.mapsPlaceUrl ?? ""}
            onChange={(value) =>
              update({ contact: { ...settings.contact, mapsPlaceUrl: value || null } })
            }
          />
        </div>
      </section>

      {/* ---------------- Social ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          {t.settings.social}
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

      {/* ---------------- Branding ---------------- */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">
          {t.settings.branding}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField
            label={t.settings.brandColor}
            dir="ltr"
            value={settings.branding.brandColor}
            onChange={(value) =>
              update({ branding: { ...settings.branding, brandColor: value } })
            }
          />
          <TextField
            label={t.settings.logoLight}
            dir="ltr"
            value={settings.branding.logoUrl ?? ""}
            onChange={(value) =>
              update({ branding: { ...settings.branding, logoUrl: value || null } })
            }
          />
          <TextField
            label={t.settings.logoDark}
            dir="ltr"
            value={settings.branding.logoUrlDark ?? ""}
            onChange={(value) =>
              update({ branding: { ...settings.branding, logoUrlDark: value || null } })
            }
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{t.settings.logoHint}</p>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? t.common.saving : t.common.save}
      </button>
    </form>
  );
}
