-- ============================================================
-- ThesisAI — Migration 005: Add donations table
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('saweria', 'kofi', 'trakteer', 'manual')),
    amount INTEGER NOT NULL, -- dalam sen/rupiah (integer untuk akurasi)
    currency TEXT NOT NULL DEFAULT 'IDR',
    donor_name TEXT,
    donor_message TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query umum
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations (user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_platform ON public.donations (platform);

-- RLS: hanya user yg login bisa lihat donasi mereka (kalau ada user_id)
-- admin/service role bisa lihat semua
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Policy: user bisa lihat donasi mereka sendiri (pakai IF NOT EXISTS)
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
CREATE POLICY "Users can view own donations" ON public.donations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: system/service role bisa insert (untuk webhook nanti)
-- Hanya service role yg bisa insert/update/delete
-- (RLS dengan service role otomatis bypass, jadi tidak perlu policy eksplisit)

-- View untuk agregasi donasi total (tanpa RLS, dipanggil via server)
CREATE OR REPLACE VIEW public.donation_stats AS
SELECT
    COALESCE(SUM(amount), 0) AS total_amount_idr,
    COUNT(*) AS total_count,
    COALESCE(SUM(CASE WHEN platform = 'saweria' THEN amount ELSE 0 END), 0) AS saweria_amount,
    COALESCE(SUM(CASE WHEN platform = 'kofi' THEN amount ELSE 0 END), 0) AS kofi_amount,
    COALESCE(SUM(CASE WHEN platform = 'trakteer' THEN amount ELSE 0 END), 0) AS trakteer_amount,
    MAX(created_at) AS last_donation_at
FROM public.donations
WHERE status = 'completed';

-- View untuk goal progress (misal target 5 juta)
CREATE OR REPLACE VIEW public.donation_goal AS
SELECT
    5000000 AS target_amount_idr,
    COALESCE(SUM(amount), 0) AS current_amount_idr,
    ROUND(COALESCE(SUM(amount), 0) * 100.0 / 5000000, 1) AS progress_percent,
    GREATEST(5000000 - COALESCE(SUM(amount), 0), 0) AS remaining_amount_idr
FROM public.donations
WHERE status = 'completed';