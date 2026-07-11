-- ============================================================
-- ThesisAI — Migration 004: Add rate_limit table
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limit (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk cleanup otomatis
CREATE INDEX IF NOT EXISTS idx_rate_limit_reset_at ON public.rate_limit (reset_at);

-- RLS: hanya system (service role) yang bisa akses
ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;

-- Policy: tidak ada user access — hanya server-side via service role
-- (RLS dengan service role bypass otomatis)