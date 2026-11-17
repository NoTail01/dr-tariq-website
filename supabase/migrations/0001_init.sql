-- ------------------------------------------------------------------
-- Dr Tariq Abu Hweij website — content backend schema
--
-- Idempotent: safe to run more than once. Row Level Security is enabled
-- with NO policies, so only the service-role key used by the server can
-- read or write. The anon/public key cannot touch any of these tables.
--
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ------------------------------------------------------------------

-- Articles: one row per article. The full article JSON is kept in `data`
-- so the store can grow without migrations; the denormalised columns only
-- exist for filtering and ordering.
create table if not exists public.articles (
  id          text primary key,
  slug        jsonb       not null,
  status      text        not null default 'draft'
              check (status in ('draft', 'published')),
  is_demo     boolean     not null default false,
  updated_at  timestamptz not null default now(),
  data        jsonb       not null
);

create index if not exists articles_status_idx on public.articles (status);
create index if not exists articles_is_demo_idx on public.articles (is_demo);

alter table public.articles enable row level security;
-- No policies on purpose: service-role only.

-- Settings: exactly one row, keyed by the constant below.
create table if not exists public.site_settings (
  id          text primary key default 'site',
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;
-- No policies on purpose: service-role only.

-- Appointment requests submitted by the public booking form. The form
-- deliberately collects no medical information (name + contact only).
create table if not exists public.appointment_requests (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text        not null,
  contact_method text        not null
                 check (contact_method in ('email', 'phone', 'whatsapp')),
  contact_value  text        not null,
  preferred_time text,
  message        text
);

alter table public.appointment_requests enable row level security;
-- No policies on purpose: only the server's service-role key may read
-- or insert patient contact details.

-- ------------------------------------------------------------------
-- Storage bucket for uploaded media (public read, server-only write).
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
