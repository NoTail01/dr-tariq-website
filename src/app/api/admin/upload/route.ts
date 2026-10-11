import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { guardAdmin } from "@/lib/admin-api";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * POST /api/admin/upload — local image storage (authenticated only).
 *
 * Files are written to `public/uploads/`. When Supabase is activated, this
 * handler switches to Supabase Storage — see docs/SUPABASE.md.
 * SVG uploads are rejected because they can carry scripts.
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

  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(directory, name), buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${name}` }, { status: 201 });
}
