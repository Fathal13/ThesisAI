-- ============================================================
-- ThesisAI — Feedback & Complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kategori TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'dibaca', 'dibalas', 'selesai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.feedbacks TO authenticated;

DROP TRIGGER IF EXISTS feedbacks_updated_at ON public.feedbacks;
CREATE TRIGGER feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: user INSERT, dan SELECT milik sendiri
DROP POLICY IF EXISTS "Users can insert feedbacks" ON public.feedbacks;
CREATE POLICY "Users can insert feedbacks"
  ON public.feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can view own feedbacks"
  ON public.feedbacks FOR SELECT
  USING (auth.uid() = user_id);
