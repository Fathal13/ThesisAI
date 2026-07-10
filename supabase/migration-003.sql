-- ============================================================
-- ThesisAI — Migration 003: Add favorit column to sidang_questions
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Tambah kolom favorit untuk bookmark pertanyaan
ALTER TABLE public.sidang_questions ADD COLUMN IF NOT EXISTS favorit BOOLEAN DEFAULT false;

-- Update RLS untuk kolom baru (sudah cover by existing RLS policy)
