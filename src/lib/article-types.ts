export const ARTICLE_CATEGORIES = ["demo", "guides", "news"] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function isArticleCategory(value: string): value is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

export type Localized = { ar: string; en: string };

export type ArticleStatus = "draft" | "published";

/**
 * Medical approval state — tracked independently of publication.
 * The 10 prepared articles are stored as drafts with `pending` review so
 * the doctor can approve or request changes before anything goes public.
 */
export type ReviewStatus = "pending" | "approved" | "needs-changes";

export type ArticleReview = {
  status: ReviewStatus;
  /** Free-text note from the reviewer (or for the reviewer). */
  notes: string | null;
  /** ISO timestamp of the last review decision. */
  reviewedAt: string | null;
};

export const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "needs-changes"];

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
}

export type Article = {
  id: string;
  status: ArticleStatus;
  /** Demo articles are templates, never medical content: hidden in production. */
  isDemo: boolean;
  slug: Localized;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  category: ArticleCategory;
  coverImage: { url: string; alt: Localized } | null;
  seo: { title: Localized; description: Localized };
  author: Localized;
  /** Optional reference for factual claims. */
  sourceUrl: string | null;
  /** Medical review state — never inferred from publication. */
  review: ArticleReview;
  publishedAt: string | null;
  updatedAt: string;
};

export type ArticleDraftInput = Omit<Article, "id" | "updatedAt">;

export type ValidationResult =
  | { ok: true; value: ArticleDraftInput }
  | { ok: false; errors: Record<string, string> };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX = {
  title: 200,
  excerpt: 400,
  body: 50_000,
  seoTitle: 70,
  seoDescription: 170,
  slug: 120,
} as const;

const missing = (label: string) => `${label} is required when an article is published.`;

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readLocalized(value: unknown): Localized {
  const source =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return { ar: readText(source.ar), en: readText(source.en) };
}

function readObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * Server-side validation for article payloads coming from the admin API.
 * Never trust the browser: the dashboard is not the only client.
 */
export function validateArticleInput(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { _: "Invalid payload." } };
  }

  const raw = input as Record<string, unknown>;

  const status: ArticleStatus = raw.status === "published" ? "published" : "draft";
  const isDemo = raw.isDemo === true;

  let category: ArticleCategory = "demo";
  const categoryInput = readText(raw.category);
  if (isArticleCategory(categoryInput)) {
    category = categoryInput;
  } else {
    errors.category = "Choose a valid category.";
  }

  const slug = readLocalized(raw.slug);
  const title = readLocalized(raw.title);
  const excerpt = readLocalized(raw.excerpt);
  const body = readLocalized(raw.body);
  const author = readLocalized(raw.author);
  const seoRaw = readObject(raw.seo);
  const seo = {
    title: readLocalized(seoRaw.title),
    description: readLocalized(seoRaw.description),
  };

  const coverRaw = readObject(raw.coverImage);
  const coverUrl = readText(coverRaw.url);
  let coverImage: { url: string; alt: Localized } | null = null;
  if (coverUrl) {
    const alt = readLocalized(coverRaw.alt);
    if (!alt.ar || !alt.en) {
      errors["coverImage.alt"] = "Image alt text is required in both languages.";
    }
    coverImage = { url: coverUrl, alt };
  }

  let sourceUrl: string | null = null;
  const sourceInput = readText(raw.sourceUrl);
  if (sourceInput) {
    if (!/^https?:\/\//i.test(sourceInput)) {
      errors.sourceUrl = "Source URL must start with http:// or https://";
    } else {
      sourceUrl = sourceInput;
    }
  }

  // Medical review is a separate decision from publication. Unknown or
  // missing values default to "pending" — never to "approved".
  const reviewStatus: ReviewStatus = isReviewStatus(raw.reviewStatus)
    ? (raw.reviewStatus as ReviewStatus)
    : "pending";
  const review: ArticleReview = {
    status: reviewStatus,
    notes: readText(raw.reviewNotes) || null,
    reviewedAt:
      typeof raw.reviewedAt === "string" && raw.reviewedAt ? raw.reviewedAt : null,
  };

  if (!author.ar && !author.en) {
    author.ar = "Dr Tariq Abu Hweij";
    author.en = "Dr Tariq Abu Hweij";
  } else {
    author.ar = author.ar || author.en;
    author.en = author.en || author.ar;
  }

  for (const locale of ["ar", "en"] as const) {
    if (title[locale].length > MAX.title) {
      errors[`title.${locale}`] = `Title must be ${MAX.title} characters or fewer.`;
    }
    if (excerpt[locale].length > MAX.excerpt) {
      errors[`excerpt.${locale}`] = `Excerpt must be ${MAX.excerpt} characters or fewer.`;
    }
    if (body[locale].length > MAX.body) {
      errors[`body.${locale}`] = `Body must be ${MAX.body} characters or fewer.`;
    }
    if (slug[locale].length > MAX.slug) {
      errors[`slug.${locale}`] = `Slug must be ${MAX.slug} characters or fewer.`;
    }
    if (seo.title[locale].length > MAX.seoTitle) {
      errors[`seo.title.${locale}`] = `SEO title must be ${MAX.seoTitle} characters or fewer.`;
    }
    if (seo.description[locale].length > MAX.seoDescription) {
      errors[`seo.description.${locale}`] = `SEO description must be ${MAX.seoDescription} characters or fewer.`;
    }

    if (slug[locale] && !SLUG_PATTERN.test(slug[locale])) {
      errors[`slug.${locale}`] = "Use lowercase Latin letters, numbers and hyphens only.";
    }

    if (status === "published") {
      if (!slug[locale]) errors[`slug.${locale}`] = missing(`Slug (${locale})`);
      if (!title[locale]) errors[`title.${locale}`] = missing(`Title (${locale})`);
      if (!body[locale]) errors[`body.${locale}`] = missing(`Body (${locale})`);
      if (!excerpt[locale]) errors[`excerpt.${locale}`] = missing(`Excerpt (${locale})`);
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const publishedAt =
    typeof raw.publishedAt === "string" && raw.publishedAt ? raw.publishedAt : null;

  return {
    ok: true,
    value: {
      status,
      isDemo,
      category,
      slug,
      title,
      excerpt,
      body,
      coverImage,
      seo,
      author,
      sourceUrl,
      review,
      publishedAt,
    },
  };
}

export function makeId(): string {
  return crypto.randomUUID();
}
