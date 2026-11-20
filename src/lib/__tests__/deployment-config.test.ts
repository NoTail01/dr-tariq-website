import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { pageMetadata } from "@/lib/seo";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/0001_init.sql"),
  "utf8",
);

describe("Supabase migration", () => {
  it("creates the booking table used by the public form", () => {
    expect(migration).toContain("create table if not exists public.appointment_requests");
  });

  it("enables row level security on every content table", () => {
    for (const table of ["articles", "site_settings", "appointment_requests"]) {
      expect(migration).toContain("alter table public." + table + " enable row level security;");
    }
  });
});

describe("SEO metadata", () => {
  it("uses the site name for og:site_name", () => {
    const meta = pageMetadata({
      locale: "en",
      path: "/",
      title: "Home",
      description: "Clinic homepage",
    });
    expect(meta.openGraph?.siteName).toBe("Dr Tariq Abu Hweij");
    expect(meta.openGraph?.siteName).not.toBe("Home");
  });

  it("uses a valid Open Graph locale for Arabic", () => {
    const meta = pageMetadata({
      locale: "ar",
      path: "/",
      title: "الرئيسية",
      description: "الصفحة الرئيسية",
    });
    expect(meta.openGraph?.locale).toBe("ar_JO");
  });
});

const hardeningMigration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/0002_booking_hardening.sql"),
  "utf8",
);

describe("booking hardening migration", () => {
  it("limits stored appointment field lengths", () => {
    for (const name of [
      "appointment_requests_name_len",
      "appointment_requests_contact_len",
      "appointment_requests_preferred_time_len",
      "appointment_requests_message_len",
    ]) {
      expect(hardeningMigration).toContain(name);
    }
  });

  it("caps upload bucket size and MIME types without granting anon policies", () => {
    expect(hardeningMigration).toContain("file_size_limit = 4194304");
    expect(hardeningMigration).toContain("allowed_mime_types");
    expect(hardeningMigration).not.toMatch(/create policy/i);
  });
});
