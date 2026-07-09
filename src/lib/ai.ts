import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
})

export const gemini = google("gemini-2.0-flash-001")

// ──────────────────────────────────────────
//  Rate limit & error handling helpers
// ──────────────────────────────────────────
const MAX_RETRIES = 2
const INITIAL_DELAY = 1000

export class AIRateLimitError extends Error {
  constructor() {
    super("Kuota AI sedang habis. Coba lagi dalam beberapa menit.")
    this.name = "AIRateLimitError"
  }
}

export class AITimeoutError extends Error {
  constructor() {
    super("AI tidak merespon tepat waktu. Coba lagi.")
    this.name = "AITimeoutError"
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastError = err

      // Rate limit — retry setelah delay
      const errObj = err as { status?: number; message?: string }
      if (
        errObj?.status === 429 ||
        errObj?.message?.includes("429") ||
        errObj?.message?.includes("RESOURCE_EXHAUSTED") ||
        errObj?.message?.includes("quota")
      ) {
        if (attempt < retries) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt) // exponential backoff
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        throw new AIRateLimitError()
      }

      // Timeout
      if (errObj?.message?.includes("timeout") || errObj?.message?.includes("timed out")) {
        throw new AITimeoutError()
      }

      // Error lain — throw langsung
      throw err
    }
  }

  throw lastError
}

function cleanJson(text: string): string {
  return text.replace(/```(json)?\n?/g, "").trim()
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(cleanJson(text))
  } catch {
    return fallback
  }
}

// ──────────────────────────────────────────
//  Literature — Rangkum artikel akademik
// ──────────────────────────────────────────
export async function summarizeLiterature(
  title: string,
  abstract: string
): Promise<{
  problem: string
  method: string
  result: string
  gap: string
}> {
  const prompt = `
Anda adalah asisten akademik yang membantu mahasiswa merangkum artikel ilmiah.
Berdasarkan judul dan abstrak berikut, buat ringkasan terstruktur dalam Bahasa Indonesia.

Judul: ${title}
Abstrak: ${abstract}

Format jawaban (JSON):
{
  "problem": "Masalah yang diangkat (1-2 kalimat)",
  "method": "Metode yang digunakan (1-2 kalimat)",
  "result": "Hasil utama yang ditemukan (1-2 kalimat)",
  "gap": "Kesenjangan atau saran riset selanjutnya (1 kalimat)"
}
`

  const { text } = await withRetry(() =>
    generateText({ model: gemini, prompt })
  )

  return safeJsonParse(text, {
    problem: "Gagal merangkum",
    method: "Gagal merangkum",
    result: "Gagal merangkum",
    gap: "Gagal merangkum",
  })
}

// ──────────────────────────────────────────
//  Writing — Koreksi & rekomendasi bab
// ──────────────────────────────────────────
export interface WritingReview {
  grammar: string[]
  wordChoice: string[]
  structure: string[]
  clarity: string[]
}

export async function reviewWriting(
  judulBab: string,
  konten: string
): Promise<WritingReview> {
  const prompt = `
Anda adalah korektor akademik untuk skripsi mahasiswa Indonesia.
Review bagian "${judulBab}" berikut dan berikan saran perbaikan.

Konten:
${konten}

Berikan output JSON:
{
  "grammar": ["Kesalahan tata bahasa yang ditemukan..."],
  "wordChoice": ["Rekomendasi kata lebih formal..."],
  "structure": ["Masalah struktur atau logika penulisan..."],
  "clarity": ["Kalimat ambigu atau perlu diperjelas..."]
}

Maksimal 3 poin per kategori. Gunakan Bahasa Indonesia.
`

  const { text } = await withRetry(() =>
    generateText({ model: gemini, prompt })
  )

  return safeJsonParse(text, {
    grammar: ["Gagal menganalisis grammar"],
    wordChoice: ["Gagal menganalisis pilihan kata"],
    structure: ["Gagal menganalisis struktur"],
    clarity: ["Gagal menganalisis kejelasan"],
  })
}

// ──────────────────────────────────────────
//  Sidang — Generator pertanyaan sidang
// ──────────────────────────────────────────
export interface SidangQuestion {
  question: string
  category: "Metodologi" | "Teori" | "Hasil" | "Impak"
  sampleAnswer: string
}

export async function generateSidangQuestions(
  kontenBab: string,
  judulSkripsi: string
): Promise<SidangQuestion[]> {
  const prompt = `
Anda adalah dosen penguji skripsi. Berdasarkan konten bab berikut dan judul skripsi,
buat 10 pertanyaan sidang yang paling mungkin ditanyakan.

Judul Skripsi: ${judulSkripsi}

Konten Bab:
${kontenBab}

Output JSON (array):
[
  {
    "question": "Pertanyaan sidang...",
    "category": "Metodologi | Teori | Hasil | Impak",
    "sampleAnswer": "Contoh jawaban ideal..."
  }
]

Buat bervariasi kategorinya. Gunakan Bahasa Indonesia. Berikan jawaban yang akademik dan berbobot.
`

  const { text } = await withRetry(() =>
    generateText({ model: gemini, prompt })
  )

  return safeJsonParse(text, [])
}

// ──────────────────────────────────────────
//  Dashboard — Motivasi / tips random
// ──────────────────────────────────────────
export async function generateMotivation(
  progress: number,
  nama: string
): Promise<string> {
  const prompt = `
Anda adalah mentor skripsi yang supportive. Berikan satu kalimat motivasi singkat
dalam Bahasa Indonesia untuk mahasiswa bernama ${nama} yang sudah menyelesaikan
${progress} dari 5 bab skripsinya. Santai tapi tetap akademik.
`

  const { text } = await withRetry(() =>
    generateText({ model: gemini, prompt })
  )

  return text
}
