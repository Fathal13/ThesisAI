import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, type LanguageModel } from "ai"

// ──────────────────────────────────────────
//  Multi-Provider definitions
//  Chain: Gemini → NVIDIA NIM → OpenRouter → Groq
// ──────────────────────────────────────────

const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
})

const nvidiaProvider = createOpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY ?? "",
  baseURL: "https://integrate.api.nvidia.com/v1",
})

const openrouterProvider = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://thesisai.vercel.app",
    "X-Title": "ThesisAI",
  },
})

const groqProvider = createOpenAI({
  apiKey: process.env.GROQ_API_KEY ?? "",
  baseURL: "https://api.groq.com/openai/v1",
})

const MODELS = {
  gemini: geminiProvider("gemini-2.0-flash-001"),
  nvidia: nvidiaProvider("nvidia/nemotron-3-nano-30b-a3b"),
  openrouter: openrouterProvider("mistralai/mistral-7b-instruct:free"),
  groq: groqProvider("llama-3.3-70b-versatile"),
} as const

// ──────────────────────────────────────────
//  Provider status tracking (for UI)
// ──────────────────────────────────────────

export type ProviderName = "gemini" | "nvidia" | "openrouter" | "groq"

let activeProvider: ProviderName = "gemini"

/** Provider yg sedang digunakan (bisa dicek dari client via API) */
export function getActiveProvider(): ProviderName {
  return activeProvider
}

/** Reset ke default */
export function resetActiveProvider(): void {
  activeProvider = "gemini"
}

// ──────────────────────────────────────────
//  Error types
// ──────────────────────────────────────────

export class AIRateLimitError extends Error {
  constructor(public readonly provider: ProviderName) {
    super(`Kuota AI (${provider}) sedang habis. Coba lagi dalam beberapa menit.`)
    this.name = "AIRateLimitError"
  }
}

export class AITimeoutError extends Error {
  constructor(public readonly provider: ProviderName) {
    super(`AI (${provider}) tidak merespon tepat waktu. Coba lagi.`)
    this.name = "AITimeoutError"
  }
}

export class AIAllProvidersFailedError extends Error {
  constructor(public readonly errors: Array<{ provider: ProviderName; error: string }>) {
    const detail = errors.map((e) => `• ${e.provider}: ${e.error}`).join("\n")
    super(
      `Semua provider AI gagal.\n${detail}\n\nCoba lagi nanti atau periksa konfigurasi API key.`,
    )
    this.name = "AIAllProvidersFailedError"
  }
}

// ──────────────────────────────────────────
//  Error classification helpers
// ──────────────────────────────────────────

function isRateLimitError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? ""
  const status = (err as { status?: number })?.status
  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("rate_limit") ||
    msg.includes("Rate limit") ||
    msg.includes("insufficient_quota") ||
    msg.includes("Quota exceeded")
  )
}

function isTimeoutError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? ""
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("Timeout") ||
    msg.includes("TIMEOUT")
  )
}

function isAuthError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? ""
  const status = (err as { status?: number })?.status
  return (
    status === 401 ||
    status === 403 ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("unauthorized") ||
    msg.includes("Unauthorized") ||
    msg.includes("API key") ||
    msg.includes("api_key") ||
    msg.includes("invalid_api_key") ||
    msg.includes("Invalid API key")
  )
}

function isModelNotAvailable(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? ""
  const status = (err as { status?: number })?.status
  return (
    status === 404 ||
    msg.includes("model_not_found") ||
    msg.includes("model not found") ||
    msg.includes("Not Found") ||
    msg.includes("not found")
  )
}

/**
 * Apakah error ini "aman" untuk di-fallback?
 * - True → lanjut ke provider berikutnya
 * - False → throw langsung (hanya untuk error yang pasti gagal di semua provider)
 */
function shouldFallback(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? ""

  // Content policy / safety — pasti gagal di provider mana pun
  if (
    msg.includes("content_policy") ||
    msg.includes("safety") ||
    msg.includes("blocked") ||
    msg.includes("harmful")
  ) {
    return false
  }

  return true
}

// ──────────────────────────────────────────
//  API key checker
// ──────────────────────────────────────────

function getApiKeyForProvider(provider: ProviderName): string {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY ?? ""
    case "nvidia":
      return process.env.NVIDIA_NIM_API_KEY ?? ""
    case "openrouter":
      return process.env.OPENROUTER_API_KEY ?? ""
    case "groq":
      return process.env.GROQ_API_KEY ?? ""
  }
}

// ──────────────────────────────────────────
//  Fallback + Retry chain
// ──────────────────────────────────────────

const MAX_RETRIES = 2
const INITIAL_DELAY = 1000

type GenerateFn = (model: LanguageModel) => Promise<{ text: string }>

const PROVIDER_CHAIN: Array<{ name: ProviderName; model: LanguageModel }> = [
  { name: "gemini", model: MODELS.gemini },
  { name: "nvidia", model: MODELS.nvidia },
  { name: "openrouter", model: MODELS.openrouter },
  { name: "groq", model: MODELS.groq },
]

/**
 * Coba setiap provider secara berurutan dengan retry + fallback.
 *
 * Error handling strategy:
 * - Rate limit / server error / unknown → retry dulu, baru fallback
 * - Auth error / model not found → fallback LANGSUNG (gak perlu retry)
 * - Content safety / policy → throw LANGSUNG (gagal di semua provider)
 * - Timeout → retry dulu, baru fallback
 */
async function withFallbackAndRetry(fn: GenerateFn): Promise<{ text: string }> {
  const errors: Array<{ provider: ProviderName; error: string }> = []

  for (const { name, model } of PROVIDER_CHAIN) {
    const key = getApiKeyForProvider(name)
    if (!key) {
      errors.push({ provider: name, error: "API key belum dikonfigurasi" })
      continue
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        activeProvider = name
        return await fn(model)
      } catch (err: unknown) {
        const errMsg = (err as { message?: string })?.message ?? String(err)

        // Content safety / policy — throw LANGSUNG, gak berguna fallback
        if (!shouldFallback(err)) {
          console.error(`[AI] ${name} unrecoverable error (safety/policy):`, errMsg)
          throw err
        }

        // Timeout — retry dulu
        if (isTimeoutError(err)) {
          if (attempt < MAX_RETRIES) {
            console.warn(`[AI] ${name} timeout (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retry`)
            continue
          }
          console.warn(`[AI] ${name} timeout habis setelah ${MAX_RETRIES + 1}x retry — fallback`)
          errors.push({ provider: name, error: `Timeout — ${errMsg}` })
          break
        }

        // Auth / model not found → LANGSUNG fallback (gak perlu retry)
        if (isAuthError(err) || isModelNotAvailable(err)) {
          console.warn(`[AI] ${name} auth/model error — fallback: ${errMsg}`)
          errors.push({ provider: name, error: errMsg })
          break
        }

        // Rate limit — retry dengan exponential backoff
        if (isRateLimitError(err)) {
          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY * Math.pow(2, attempt)
            console.warn(
              `[AI] ${name} rate limit (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retry in ${delay}ms`,
            )
            await new Promise((r) => setTimeout(r, delay))
            continue
          }
          console.warn(`[AI] ${name} rate limit habis setelah ${MAX_RETRIES + 1}x retry — fallback`)
          errors.push({ provider: name, error: `Rate limit — ${errMsg}` })
          break
        }

        // Error lain (server error, unknown) — retry dulu, baru fallback
        if (attempt < MAX_RETRIES) {
          console.warn(
            `[AI] ${name} error (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retry: ${errMsg}`,
          )
          continue
        }
        console.warn(`[AI] ${name} error habis setelah ${MAX_RETRIES + 1}x retry — fallback: ${errMsg}`)
        errors.push({ provider: name, error: errMsg })
        break
      }
    }
  }

  // Semua provider gagal
  activeProvider = "gemini"
  throw new AIAllProvidersFailedError(errors)
}

// ──────────────────────────────────────────
//  JSON helpers (unchanged)
// ──────────────────────────────────────────

function cleanJson(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```(json)?\n?/g, "").trim()

  // Try to extract JSON object or array if there's extra text
  // Match first { ... } or [ ... ]
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const objMatch = cleaned.match(/\{[\s\S]*\}/)
    const arrMatch = cleaned.match(/\[[\s\S]*\]/)
    cleaned = (objMatch || arrMatch)?.[0] ?? cleaned
  }

  return cleaned
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(cleanJson(text))
  } catch {
    console.warn(`[AI] JSON parse failed — using fallback`)
    return fallback
  }
}

// ──────────────────────────────────────────
//  Literature — Rangkum artikel akademik
// ──────────────────────────────────────────

export async function summarizeLiterature(
  title: string,
  abstract: string,
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

PENTING: Berikan HANYA JSON, tanpa markdown, tanpa penjelasan, tanpa pembatas. Output:
{
  "problem": "Masalah yang diangkat (1-2 kalimat)",
  "method": "Metode yang digunakan (1-2 kalimat)",
  "result": "Hasil utama yang ditemukan (1-2 kalimat)",
  "gap": "Kesenjangan atau saran riset selanjutnya (1 kalimat)"
}
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
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
  konten: string,
): Promise<WritingReview> {
  const prompt = `
Anda adalah korektor akademik untuk skripsi mahasiswa Indonesia.
Review bagian "${judulBab}" berikut dan berikan saran perbaikan.

Konten:
${konten}

PENTING: Berikan HANYA JSON, tanpa markdown, tanpa penjelasan, tanpa pembatas. Output:
{
  "grammar": ["Kesalahan tata bahasa yang ditemukan..."],
  "wordChoice": ["Rekomendasi kata lebih formal..."],
  "structure": ["Masalah struktur atau logika penulisan..."],
  "clarity": ["Kalimat ambigu atau perlu diperjelas..."]
}

Maksimal 3 poin per kategori. Gunakan Bahasa Indonesia.
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
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
  judulSkripsi: string,
): Promise<SidangQuestion[]> {
  const prompt = `
Anda adalah dosen penguji skripsi. Berdasarkan konten bab berikut dan judul skripsi,
buat 10 pertanyaan sidang yang paling mungkin ditanyakan.

Judul Skripsi: ${judulSkripsi}

Konten Bab:
${kontenBab}

PENTING: Berikan HANYA array JSON, TANPA markdown, TANPA kata pengantar, TANPA penjelasan.
Output:
[
  {
    "question": "Pertanyaan sidang...",
    "category": "Metodologi",
    "sampleAnswer": "Contoh jawaban ideal..."
  }
]

Kategori hanya salah satu dari: Metodologi, Teori, Hasil, Impak.
Buat bervariasi kategorinya. Gunakan Bahasa Indonesia. Berikan jawaban yang akademik dan berbobot.
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
  )

  console.log(`[AI] Raw sidang response (first 200): ${text.slice(0, 200)}`)
  return safeJsonParse(text, [])
}

// ──────────────────────────────────────────
//  Dashboard — Motivasi / tips random
// ──────────────────────────────────────────

// ──────────────────────────────────────────
//  Literature — Generate draft BAB dari artikel
// ──────────────────────────────────────────

const BAB_PROMPTS: Record<number, string> = {
  1: `Pendahuluan (latar belakang, rumusan masalah, tujuan penelitian, manfaat penelitian).
Fokus: jelaskan konteks riset berdasarkan artikel ini, rumuskan masalah penelitian yang relevan, dan tetapkan tujuan yang bisa dicapai.`,
  2: `Tinjauan Pustaka (landasan teori, penelitian terdahulu, kerangka berpikir).
Fokus: jabarkan teori-teori utama dari artikel ini, posisikan artikel ini dalam konteks penelitian terdahulu, dan jelaskan bagaimana artikel ini mendukung kerangka berpikir skripsi.`,
  3: `Metodologi Penelitian (pendekatan, metode, teknik pengumpulan data, analisis).
Fokus: jelaskan metode yang digunakan di artikel ini sebagai referensi, bandingkan dengan metode alternatif, dan berikan rekomendasi pendekatan yang sesuai untuk skripsi.`,
  4: `Hasil dan Pembahasan (temuan utama, interpretasi, implikasi).
Fokus: uraikan temuan utama artikel, bahas implikasinya terhadap topik skripsi, dan kaitkan dengan konteks yang lebih luas.`,
  5: `Kesimpulan dan Saran (ringkasan temuan, kontribusi, keterbatasan, saran riset lanjutan).
Fokus: rangkum kontribusi artikel, identifikasi keterbatasannya sebagai celah riset, dan berikan saran untuk penelitian selanjutnya.`,
}

export async function generateBabFromLiterature(
  literatureJudul: string,
  literatureAbstrak: string | null,
  literatureRangkuman: { problem: string; method: string; result: string; gap: string } | null,
  babNumber: number,
  judulSkripsi: string,
  penulis: string,
  tahun: number | null,
): Promise<string> {
  const babFocus = BAB_PROMPTS[babNumber] ?? "Tinjauan Pustaka"

  const rangkumanText = literatureRangkuman
    ? `
### Ringkasan Artikel (AI)
- **Masalah:** ${literatureRangkuman.problem}
- **Metode:** ${literatureRangkuman.method}
- **Hasil:** ${literatureRangkuman.result}
- **Gap:** ${literatureRangkuman.gap}
`
    : ""

  const abstrakText = literatureAbstrak
    ? `\n### Abstrak\n${literatureAbstrak}`
    : ""

  const prompt = `
Anda adalah asisten akademik yang membantu mahasiswa menulis skripsi. Tugas Anda adalah membuat draft BAB SKRIPSI berdasarkan satu artikel ilmiah referensi.

### Tugas
Buat draft BAB ${babNumber} untuk skripsi dengan judul: "${judulSkripsi}"

### Artikel Referensi
- **Judul:** ${literatureJudul}
- **Penulis:** ${penulis}
- **Tahun:** ${tahun ?? "N/A"}
${rangkumanText}${abstrakText}

### Fokus Bab ${babNumber}
${babFocus}

### Peringatan — HANYA Abstrak
Anda HANYA punya abstrak dan/atau rangkuman singkat dari artikel ini. Anda TIDAK membaca full-text artikel. Oleh karena itu:

1. **JANGAN mengarang detail metodologi, angka, atau temuan spesifik yang tidak ada di sumber.**
2. Jika informasi di sumber tidak cukup untuk suatu bagian, tulis: "[butuh verifikasi dari artikel asli]"
3. Fokus pada KERANGKA dan IDE UTAMA — jangan mencoba membuat narasi yang terdengar meyakinkan tapi sebenarnya halusinasi.
4. **Kamu tetap perlu membaca artikelnya secara langsung!**

### Aturan Penting
1. Tulis dalam Bahasa Indonesia akademik yang formal dan jelas
2. Panjang: 400-800 kata (sekitar 2-4 paragraf)
3. Gunakan artikel ini sebagai referensi utama — kutip dengan (Penulis, Tahun) di tempat yang relevan
4. Jangan menyalin mentah abstrak — kembangkan menjadi narasi bab yang utuh
5. Akhiri dengan kalimat transisi ke bab berikutnya (jika relevan)
6. Gunakan format paragraf yang rapi (bukan bullet points)
7. JANGAN gunakan markdown atau format JSON — langsung teks paragraf biasa
8. Cantumkan footnote/daftar pustaka di bagian bawah jika ada sitasi dari artikel ini

### Output
Teks draft BAB ${babNumber} yang siap diedit mahasiswa. Langsung mulai dengan konten bab, tanpa kata pengantar.

Di AWAL output, tambahkan disclaimer dalam format:
> **Catatan:** Draft ini dibuat berdasarkan abstrak. Ada kemungkinan detail tidak lengkap. Kamu tetap perlu membaca artikelnya secara langsung!
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
  )

  return text.trim()
}

// ──────────────────────────────────────────
//  Literature — Ekstraksi kata kunci pencarian
// ──────────────────────────────────────────

/** Ekstrak 2-3 keyword penting dari query pencarian user untuk CrossRef */
export async function extractSearchKeywords(query: string): Promise<string> {
  const prompt = `
Anda adalah asisten akademik. Dari query pencarian artikel ilmiah berikut, ekstrak 2-3 kata kunci PALING PENTING yang akan digunakan untuk mencari di CrossRef.

Query: "${query}"

Aturan:
- Pilih kata kunci yang paling spesifik dan relevan (bukan kata umum seperti "dampak", "pengaruh", "perkembangan", "peran", "analisis", "studi")
- Gabungkan dengan AND — contoh: "Artificial Intelligence AND Employment"
- Gunakan Bahasa Inggris untuk hasil yang lebih luas di database internasional
- Maksimal 3 kata kunci yang digabung dengan AND
- Jika query sudah dalam Bahasa Inggris, pertahankan

PENTING: Berikan HANYA teks query tanpa markdown, tanpa penjelasan, tanpa tanda petik.
Contoh output: "artificial intelligence AND employment"
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
  )

  return text.trim().replace(/^["']|["']$/g, "").replace(/```/g, "").trim()
}

export async function generateMotivation(
  progress: number,
  nama: string,
): Promise<string> {
  const prompt = `
Anda adalah mentor skripsi yang supportive. Berikan satu kalimat motivasi singkat
dalam Bahasa Indonesia untuk mahasiswa bernama ${nama} yang sudah menyelesaikan
${progress} dari 5 bab skripsinya. Santai tapi tetap akademik.
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
  )

  return text
}

// ──────────────────────────────────────────
//  Sidang — Evaluasi jawaban user
// ──────────────────────────────────────────

export async function evaluateAnswer(
  question: string,
  userAnswer: string,
  sampleAnswer: string,
): Promise<string[]> {
  const prompt = `
Anda adalah dosen penguji skripsi yang sedang mengevaluasi jawaban mahasiswa dalam simulasi sidang.

Pertanyaan: ${question}

Jawaban mahasiswa: ${userAnswer}

Contoh jawaban ideal: ${sampleAnswer}

Berikan 3-5 poin evaluasi dalam Bahasa Indonesia yang mencakup:
1. Kekuatan dari jawaban mahasiswa (apa yang sudah baik)
2. Kelemahan atau hal yang kurang
3. Saran spesifik untuk perbaikan

PENTING: Berikan HANYA array JSON string, tanpa markdown, tanpa pembatas.
["Poin evaluasi 1...", "Poin evaluasi 2...", ...]
`

  const { text } = await withFallbackAndRetry((model) =>
    generateText({ model, prompt }),
  )

  console.log(`[AI] Raw evaluate response (first 200): ${text.slice(0, 200)}`)
  return safeJsonParse(text, ["Gagal mengevaluasi jawaban. Coba lagi."])
}
