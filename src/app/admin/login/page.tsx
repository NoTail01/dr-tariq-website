"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useDashboardLocale } from "../../../components/admin/useDashboardLocale";

export default function AdminLoginPage() {
  const { locale, t } = useDashboardLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean; enabled: boolean }) => {
        if (cancelled) return;
        setEnabled(data.enabled);
        if (data.authenticated) router.replace("/admin/articles");
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        reason?: string;
      } | null;

      if (!response.ok || !body?.ok) {
        if (body?.reason === "disabled" || response.status === 403) {
          setError(t.login.disabled);
        } else if (body?.reason === "rate_limited" || response.status === 429) {
          setError(t.login.rateLimited);
        } else {
          setError(t.login.invalidCredentials);
        }
        return;
      }

      setPassword("");
      router.replace("/admin/articles");
      router.refresh();
    } catch {
      setError(t.login.unreachable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white">
            DT
          </span>
          <div>
            <h1 className="text-lg font-bold text-navy-900">{t.login.title}</h1>
            <p className="text-xs text-slate-500">{t.login.subtitle}</p>
          </div>
        </div>

        {enabled === false ? (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t.login.disabled}
          </p>
        ) : enabled === true ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-semibold text-navy-900">
                {t.login.username}
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-brand-600"
                placeholder={t.login.usernamePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-navy-900">
                {t.login.password}
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-brand-600"
                placeholder={t.login.passwordPlaceholder}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {busy ? t.login.signingIn : t.login.signIn}
            </button>

            <p className="text-xs leading-relaxed text-slate-500">{t.login.secureHint}</p>
          </form>
        ) : (
          <p className="mt-6 text-sm text-slate-500">{t.common.loading}</p>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <Link
            href={locale === "ar" ? "/ar" : "/en"}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
          >
            {t.login.backToSite}
          </Link>
        </div>
      </div>
    </main>
  );
}
