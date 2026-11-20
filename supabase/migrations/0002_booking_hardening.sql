-- ------------------------------------------------------------------
-- Booking + storage hardening (review-only).
--
-- Idempotent. Apply this in the Supabase SQL editor after review; no
-- credentials are available in this repository, so it has NOT been applied
-- here. Row Level Security remains enabled with no policies: only the
-- server's service-role key may read or write these tables.
--
-- The uploads bucket stays public for image display, but uploads are limited
-- by type and size. Storage API list/detail access for anon remains closed
-- because the site never needs it.
-- ------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointment_requests_name_len'
      and conrelid = 'public.appointment_requests'::regclass
  ) then
    alter table public.appointment_requests
      add constraint appointment_requests_name_len check (char_length(name) <= 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'appointment_requests_contact_len'
      and conrelid = 'public.appointment_requests'::regclass
  ) then
    alter table public.appointment_requests
      add constraint appointment_requests_contact_len check (char_length(contact_value) <= 320);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'appointment_requests_preferred_time_len'
      and conrelid = 'public.appointment_requests'::regclass
  ) then
    alter table public.appointment_requests
      add constraint appointment_requests_preferred_time_len check (char_length(coalesce(preferred_time, '')) <= 200);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'appointment_requests_message_len'
      and conrelid = 'public.appointment_requests'::regclass
  ) then
    alter table public.appointment_requests
      add constraint appointment_requests_message_len check (char_length(coalesce(message, '')) <= 2000);
  end if;
end $$;

-- 4 MB maximum, same types the admin upload route accepts.
update storage.buckets
   set file_size_limit = 4194304,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'uploads';
