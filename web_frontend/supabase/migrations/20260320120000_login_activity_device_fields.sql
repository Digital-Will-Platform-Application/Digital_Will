-- Run this in the Supabase SQL editor (or via Supabase CLI) so Active sessions can store device info.
-- Safe to run once.

alter table public.login_activity
  add column if not exists device_id text,
  add column if not exists device_label text,
  add column if not exists user_agent text;

comment on column public.login_activity.device_id is 'Stable id from browser localStorage (this browser)';
comment on column public.login_activity.device_label is 'Human-readable e.g. Chrome on Windows';
comment on column public.login_activity.user_agent is 'navigator.userAgent snapshot at login';
