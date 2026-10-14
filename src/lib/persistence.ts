import { persistMode, type PersistMode } from "./supabase";

/**
 * Thrown when a write is attempted where it would be silently lost.
 *
 * In production the local filesystem is ephemeral: a save to
 * `content/articles.json` looks successful and disappears on the next
 * deploy. Rather than pretend, writes fail with this error so the dashboard
 * can show the operator an actionable message.
 */
export class PersistenceBlockedError extends Error {
  readonly resource: string;

  constructor(resource: string) {
    super(
      `Persistence is disabled for ${resource} in this environment. ` +
        `A backend (Supabase) must be configured before content can be saved — see docs/SUPABASE.md.`,
    );
    this.name = "PersistenceBlockedError";
    this.resource = resource;
  }
}

/** Throws when the current environment cannot safely persist `resource`. */
export function assertWritable(resource: string): void {
  const mode: PersistMode = persistMode();
  if (mode === "blocked") throw new PersistenceBlockedError(resource);
}

/** Human-readable mode label for dashboard/inspection endpoints. */
export function describePersistence(): { mode: PersistMode; local: boolean; backend: boolean } {
  const mode = persistMode();
  return { mode, local: mode === "local", backend: mode === "supabase" };
}
