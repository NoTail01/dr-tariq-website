"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devMode, setDevMode] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { authenticated: boolean; mode: string; enabled: boolean }) => {
        setDevMode(data.mode === "development");
        if (data.authenticated) router.replace("/admin/articles");
      })
      .catch(() => setDevMode(false));
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;

      if (!response.ok || !body?.ok) {
        setError(
          response.status === 403
            ? "The dashboard is disabled in this environment."
            : "The access token is not valid.",
        );
        return;
      }

      router.replace("/admin/articles");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is the local server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white">
            DT
          </span>
          <div>
            <h1 className="text-lg font-bold text-navy-900">Content dashboard</h1>
            <p className="text-xs text-slate-500">Private area — authorised staff only</p>
          </div>
        </div>

        {devMode === true ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Local development mode: no token is required. Open{" "}
            <Link href="/admin/articles" className="font-semibold underline">
              Articles
            </Link>{" "}
            to continue.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-token" className="block text-sm font-semibold text-navy-900">
                Access token
              </label>
              <input
                id="admin-token"
                type="password"
                autoComplete="current-password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-brand-500 focus:outline-none"
                placeholder="ADMIN_TOKEN value"
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
              {busy ? "Checking…" : "Sign in"}
            </button>

            <p className="text-xs leading-relaxed text-slate-500">
              In production this token comes from the <code>ADMIN_TOKEN</code> environment
              variable. Supabase Auth replaces it when the backend is activated — see
              <code> docs/SUPABASE.md</code>.
            </p>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <Link href="/ar" className="text-sm font-semibold text-brand-700 hover:underline">
            ← Back to the website
          </Link>
        </div>
      </div>
    </div>
  );
}
