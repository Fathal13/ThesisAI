-- Migration: Tambah enrichment cache table
-- Jalankan via Supabase Dashboard → SQL Editor

create table if not exists enrichment_cache (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  doi text not null,
  enrichment_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: satu enrichment per user per DOI
create unique index if not exists idx_enrichment_cache_user_doi
  on enrichment_cache (user_id, doi);

-- Index untuk lookup cepat
create index if not exists idx_enrichment_cache_doi
  on enrichment_cache (doi);

-- Auto-update updated_at
create or replace function update_enrichment_cache_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_enrichment_cache_updated_at
  before update on enrichment_cache
  for each row
  execute function update_enrichment_cache_updated_at();

-- RLS: user hanya bisa lihat & edit enrichment mereka sendiri
alter table enrichment_cache enable row level security;

create policy "individuals_can_select_own" on enrichment_cache
  for select using (auth.uid() = user_id);

create policy "individuals_can_insert_own" on enrichment_cache
  for insert with check (auth.uid() = user_id);

create policy "individuals_can_update_own" on enrichment_cache
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
