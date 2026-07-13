-- Migration: Tambah RLS policy untuk table bab (insert & update)
-- Jalankan via Supabase Dashboard → SQL Editor

-- Drop existing policies kalau sudah ada
drop policy if exists "individuals_can_insert_own_bab" on bab;
drop policy if exists "individuals_can_update_own_bab" on bab;
drop policy if exists "individuals_can_select_own_bab" on bab;
drop policy if exists "individuals_can_delete_own_bab" on bab;

-- Pastikan RLS aktif
alter table bab enable row level security;

-- Select: user hanya bisa lihat bab sendiri
create policy "individuals_can_select_own_bab" on bab
  for select using (auth.uid() = user_id);

-- Insert: user hanya bisa insert bab sendiri
create policy "individuals_can_insert_own_bab" on bab
  for insert with check (auth.uid() = user_id);

-- Update: user hanya bisa update bab sendiri
create policy "individuals_can_update_own_bab" on bab
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Delete: user hanya bisa hapus bab sendiri
create policy "individuals_can_delete_own_bab" on bab
  for delete using (auth.uid() = user_id);
