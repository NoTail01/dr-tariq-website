"use client";

/**
 * Shared "unsaved changes" flag for the admin dashboard.
 *
 * Editors publish whether they hold uncommitted edits; the dashboard shell
 * subscribes to that flag and intercepts internal link navigation so clinic
 * staff cannot silently lose a draft by clicking a nav item.
 */
let unsaved = false;
const listeners = new Set<() => void>();

export function setUnsavedChanges(value: boolean): void {
  if (unsaved === value) return;
  unsaved = value;
  for (const listener of listeners) listener();
}

export function hasUnsavedChanges(): boolean {
  return unsaved;
}

export function subscribeUnsaved(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
