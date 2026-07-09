-- ============================================================
-- ThesisAI — Database Schema
-- Jalankan SQL ini di Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================

-- 1. PROFILES (extend dari auth.users bawaan Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama TEXT,
  npm TEXT,
  universitas TEXT,
  jurusan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nama'
  );
  -- Auto-create progress row
  INSERT INTO public.progress (user_id, total_bab, bab_selesai)
  VALUES (NEW.id, 5, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama kalau ada, bikin ulang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. BAB (Writing)
CREATE TABLE IF NOT EXISTS public.bab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  nomor_bab INT NOT NULL CHECK (nomor_bab BETWEEN 1 AND 5),
  konten TEXT DEFAULT '',
  target_selesai DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'revisi', 'selesai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bab_updated_at ON public.bab;
CREATE TRIGGER bab_updated_at
  BEFORE UPDATE ON public.bab
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 3. LITERATURES
CREATE TABLE IF NOT EXISTS public.literatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  penulis TEXT,
  tahun INT,
  doi TEXT,
  link TEXT,
  abstrak TEXT,
  rangkuman JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 4. SIDANG QUESTIONS
CREATE TABLE IF NOT EXISTS public.sidang_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bab_id UUID REFERENCES public.bab(id) ON DELETE CASCADE,
  pertanyaan TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Metodologi', 'Teori', 'Hasil', 'Impak')),
  jawaban_ai TEXT,
  user_answer TEXT,
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. PROGRESS
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_bab INT NOT NULL DEFAULT 5,
  bab_selesai INT NOT NULL DEFAULT 0,
  deadline_sidang DATE,
  judul_skripsi TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS progress_updated_at ON public.progress;
CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (WAJIB!)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidang_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa baca/edit profilnya sendiri
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Bab: user hanya bisa CRUD bab miliknya sendiri
DROP POLICY IF EXISTS "Users can manage own bab" ON public.bab;
CREATE POLICY "Users can manage own bab"
  ON public.bab FOR ALL
  USING (auth.uid() = user_id);

-- Literatures: user hanya bisa CRUD literatur miliknya
DROP POLICY IF EXISTS "Users can manage own literatures" ON public.literatures;
CREATE POLICY "Users can manage own literatures"
  ON public.literatures FOR ALL
  USING (auth.uid() = user_id);

-- Sidang questions: user hanya bisa CRUD pertanyaan miliknya
DROP POLICY IF EXISTS "Users can manage own questions" ON public.sidang_questions;
CREATE POLICY "Users can manage own questions"
  ON public.sidang_questions FOR ALL
  USING (auth.uid() = user_id);

-- Progress: user hanya bisa baca/edit progressnya sendiri
DROP POLICY IF EXISTS "Users can manage own progress" ON public.progress;
CREATE POLICY "Users can manage own progress"
  ON public.progress FOR ALL
  USING (auth.uid() = user_id);
