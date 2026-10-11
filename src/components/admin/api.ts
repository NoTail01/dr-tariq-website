"use client";

/** Thin fetch helpers for the dashboard (all calls go to authenticated APIs). */
export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;

  constructor(status: number, errors: Record<string, string> = {}, message = "Request failed") {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || !body) {
    throw new ApiError(
      response.status,
      (body as { errors?: Record<string, string> } | null)?.errors ?? {},
    );
  }
  return body;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(path, { cache: "no-store" }).then((response) => parse<T>(response));
}

export function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((response) => parse<T>(response));
}
