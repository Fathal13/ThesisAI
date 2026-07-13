import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"

// ─── Fetch Configuration ───
// OpenAlex max per-page = 200, max page = 50
// Kita ambil beberapa halaman pertama (paling relevan) sekaligus via parallel fetch
const MAX_CACHE_FETCH_PAGES = 3 // ambil 3 halaman × 200 = 600 artikel
const MAX_CACHE_SIZE = MAX_CACHE_FETCH_PAGES * 200

// ─── Relevance Scoring ───
// Skor = berapa banyak token signifikan dari query yang muncul di title (bobot 10) + abstract (bobot 5)
// Token adalah kata individual ≥ 3 karakter, tanpa stop words
// Makin tinggi skor → makin relevan query dengan artikel

const STOP_WORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "dengan", "pada", "ini", "itu", "untuk",
  "dalam", "adalah", "telah", "akan", "tidak", "saya", "kami", "kita", "mereka",
  "anda", "atau", "tetapi", "namun", "karena", "sebagai", "oleh", "sebuah",
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "were",
  "been", "have", "has", "had", "more", "about", "than", "also", "its",
  "other", "such", "into", "can", "may", "each", "between", "very", "over",
  "review", "systematic", "literature", "approach", "method", "based", "study",
  "studies", "analysis", "research", "effect", "impact", "using",
])

type OpenAlexRawResult = Awaited<ReturnType<typeof searchOpenAlex>>["results"][0]

interface ScoredResult extends OpenAlexRawResult {
  _relevanceScore: number
  _matchedTokens: string[]
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;.()"\-/:]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

function computeRelevanceScore(
  item: Awaited<ReturnType<typeof searchOpenAlex>>["results"][number],
  query: string,
): ScoredResult {
  const tokens = tokenize(query)
  if (tokens.length === 0) {
    return { ...item, _relevanceScore: 1, _matchedTokens: [] }
  }

  const titleLower = item.title?.toLowerCase() ?? ""
  const abstractLower = item.abstract?.toLowerCase() ?? ""
  const matchedTokens: string[] = []

  let score = 0
  for (const token of tokens) {
    let tokenScore = 0
    const inTitle = titleLower.includes(token)
    const inAbstract = abstractLower.includes(token)

    if (inTitle) {
      tokenScore += 10
      if (titleLower.startsWith(token) || titleLower.startsWith(token + " ")) {
        tokenScore += 3
      }
    }
    if (inAbstract) {
      tokenScore += 5
    }

    if (tokenScore > 0) {
      matchedTokens.push(token)
      score += tokenScore
    }
  }

  const maxPossible = tokens.length * 15
  const normalizedScore = Math.round((score / maxPossible) * 100)

  return { ...item, _relevanceScore: normalizedScore, _matchedTokens: matchedTokens }
}

// ─── In-memory search cache ───
// Hash(query + journalOnly) → { results, totalRaw, _ts }
// Cache TTL 10 menit, cleanup tiap 5 menit.

interface CacheEntry {
  results: ScoredResult[]
  totalRaw: number
  _ts: number
}

const SEARCH_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 10 * 60 * 1000
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000

if (typeof globalThis !== "undefined" && !(globalThis as Record<string, unknown>).__openalexCacheCleanup) {
  ;(globalThis as Record<string, unknown>).__openalexCacheCleanup = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of SEARCH_CACHE) {
      if (now - entry._ts > CACHE_TTL) SEARCH_CACHE.delete(key)
    }
  }, CACHE_CLEANUP_INTERVAL)
}

function makeCacheKey(query: string, journalOnly: boolean): string {
  return `${query.toLowerCase().trim()}|${journalOnly}`
}

/**
 * Fetch multiple pages from OpenAlex in parallel untuk memperbanyak pool artikel.
 * Halaman 0 = paling relevan, halaman 1+ = relevan tapi sedikit menurun.
 * Dengan multi-page, hasil scoring bisa mengambil artikel relevan yang lolos di halaman belakang.
 * OpenAlex max: 50 page × 200 per-page = 10.000 results per query.
 */
async function fetchMultiPageOpenAlex(
  query: string,
  journalOnly: boolean,
  totalPages: number,
): Promise<{ results: OpenAlexRawResult[]; total: number }> {
  const pagePromises = Array.from({ length: totalPages }, (_, i) =>
    searchOpenAlex(query, i, 200, journalOnly).catch(() => null),
  )

  const pages = await Promise.all(pagePromises)

  const seen = new Set<string>()
  const combined: OpenAlexRawResult[] = []
  let totalRaw = 0

  for (const page of pages) {
    if (!page) continue
    totalRaw = page.total

    for (const item of page.results) {
      const key = item.doi ?? item.title
      if (!seen.has(key)) {
        seen.add(key)
        combined.push(item)
      }
    }

    if (combined.length >= MAX_CACHE_SIZE) break
  }

  return { results: combined, total: totalRaw }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const perPage = Number(searchParams.get("perPage")) || 20
  const journalOnly = searchParams.get("journalOnly") === "true"
  const minScore = Number(searchParams.get("minScore")) || 15

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const cacheKey = makeCacheKey(query, journalOnly)
    let cached = SEARCH_CACHE.get(cacheKey)

    // Refresh cache hanya saat page 0 (pencarian baru)
    if (!cached || page === 0) {
      console.log(`[OpenAlex] Fetching ${MAX_CACHE_FETCH_PAGES} pages (${MAX_CACHE_SIZE} max) for "${query}"`)

      const { results, total } = await fetchMultiPageOpenAlex(query, journalOnly, MAX_CACHE_FETCH_PAGES)

      // Score setiap hasil berdasarkan overlap token dengan query
      const scored = results.map((item) => computeRelevanceScore(item, query))

      // Urutkan: relevance score desc, lalu tahun desc
      scored.sort((a, b) => {
        const scoreDiff = b._relevanceScore - a._relevanceScore
        if (scoreDiff !== 0) return scoreDiff
        return (b.year ?? 0) - (a.year ?? 0)
      })

      SEARCH_CACHE.set(cacheKey, { results: scored, totalRaw: total, _ts: Date.now() })
      cached = SEARCH_CACHE.get(cacheKey)!
    }

    const allResults = cached.results

    // Filter hasil yang di bawah threshold relevansi
    const filtered = minScore > 0
      ? allResults.filter((r) => r._relevanceScore >= minScore)
      : allResults

    const totalRaw = cached.totalRaw
    const filteredTotal = filtered.length
    const totalPages = Math.ceil(filteredTotal / perPage)
    const startIdx = page * perPage
    const pageResults = filtered.slice(startIdx, startIdx + perPage)
    const showingCount = pageResults.length

    return NextResponse.json({
      results: pageResults,
      total: filteredTotal,
      totalRaw,
      totalPages,
      page,
      perPage,
      journalOnly,
      showing: showingCount,
      message:
        filteredTotal > 0
          ? `Menampilkan ${showingCount} dari ${filteredTotal.toLocaleString("id-ID")} artikel${journalOnly ? " (jurnal saja)" : ""} (halaman ${page + 1} dari ${totalPages})`
          : "Tidak ada artikel ditemukan. Coba dengan kata kunci lain.",
    })
  } catch (error) {
    console.error("OpenAlex search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel Open Access. Coba lagi nanti." },
      { status: 500 },
    )
  }
}