// ──────────────────────────────────────────
//  User & Auth
// ──────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  nama: string | null
  npm: string | null
  universitas: string | null
  jurusan: string | null
  created_at: string
}

// ──────────────────────────────────────────
//  BAB / Writing
// ──────────────────────────────────────────
export type BabStatus = "draft" | "review" | "revisi" | "selesai"
export type BabNumber = 1 | 2 | 3 | 4 | 5

export interface Bab {
  id: string
  user_id: string
  judul: string
  nomor_bab: BabNumber
  konten: string
  target_selesai: string | null
  status: BabStatus
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────
//  Literature
// ──────────────────────────────────────────
export interface Literature {
  id: string
  user_id: string
  judul: string
  penulis: string
  tahun: number | null
  doi: string | null
  link: string | null
  abstrak: string | null
  rangkuman: LiteratureSummary | null
  created_at: string
}

export interface LiteratureSummary {
  problem: string
  method: string
  result: string
  gap: string
}

// ──────────────────────────────────────────
//  Sidang Questions
// ──────────────────────────────────────────
export type QuestionCategory = "Metodologi" | "Teori" | "Hasil" | "Impak"

export interface SidangQuestion {
  id: string
  user_id: string
  bab_id: string | null
  pertanyaan: string
  kategori: QuestionCategory
  jawaban_ai: string
  user_answer: string | null
  mastered: boolean
  favorit: boolean
  created_at: string
}

// ──────────────────────────────────────────
//  Progress / Dashboard
// ──────────────────────────────────────────
export interface Progress {
  id: string
  user_id: string
  total_bab: number
  bab_selesai: number
  deadline_sidang: string | null
  judul_skripsi: string | null
  updated_at: string
}

// ──────────────────────────────────────────
//  Database (Supabase Row Types)
// ──────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, "created_at">
        Update: Partial<Omit<UserProfile, "id">>
      }
      bab: {
        Row: Bab
        Insert: Omit<Bab, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Bab, "id" | "user_id">>
      }
      literatures: {
        Row: Literature
        Insert: Omit<Literature, "id" | "created_at">
        Update: Partial<Omit<Literature, "id" | "user_id">>
      }
      sidang_questions: {
        Row: SidangQuestion
        Insert: Omit<SidangQuestion, "id" | "created_at">
        Update: Partial<Omit<SidangQuestion, "id" | "user_id">>
      }
      progress: {
        Row: Progress
        Insert: Omit<Progress, "id" | "updated_at">
        Update: Partial<Omit<Progress, "id">>
      }
      rate_limit: {
        Row: {
          key: string
          count: number
          reset_at: string
          created_at: string
        }
        Insert: {
          key: string
          count: number
          reset_at: string
          created_at?: string
        }
        Update: {
          key?: string
          count?: number
          reset_at?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, unknown>
  }
}
