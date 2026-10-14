import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";
import { assertWritable } from "@/lib/persistence";
import { isSupabaseConfigured, supabaseUpload } from "@/lib/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/** Supabase Storage bucket for uploaded media (create it before enabling). */
const STORAGE_BUCKET = "uploads";

/**
 * POST /api/admin/upload — image storage (authenticated only).
 *
 * - Supabase Storage when the backend is configured (returns the public
 *   object URL, which survives deploys);
 * - `public/uploads/` in development only;
 * - in production with no backend the write is refused instead of being
 *   silently lost with the container.
 *
 * SVG uploads are rejected in both modes because they can carry scripts.
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "No file provided." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { ok: false, message: "Only JPEG, PNG, WebP, AVIF or GIF images are allowed." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: "Image is larger than 4 MB." },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;

  if (isSupabaseConfigured()) {
    const url = await supabaseUpload(STORAGE_BUCKET, name, bytes, file.type);
    return NextResponse.json({ ok: true, url, storage: "supabase" }, { status: 201 });
  }

  try {
    // Development only: production without a backend must not pretend a
    // local write is durable (see docs/SUPABASE.md).
    assertWritable("uploads");
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Uploads are disabled: no storage backend is configured for this environment. See docs/SUPABASE.md.",
      },
      { status: 503 },
    );
  }

  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, name), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${name}`, storage: "local" }, { status: 201 });
}
