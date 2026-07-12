import { NextResponse } from "next/server"
import { extractSearchKeywords } from "@/lib/ai"

// ─── In-memory search cache ───
// Hash(query + journalOnly) → { results, totalItems, searchQuery }
// Cache TTL 10 menit, cleanup tiap 5 menit.
// Tujuannya: page 0 fetch 200 artikel dari CrossRef, di-filter + dedup,
// lalu halaman 1,2,3,... ambil slice dari cache yang sama.

interface CacheEntry {
  results: LiteratureResult[]
  totalItems: number
  searchQuery: string
  _ts: number
}

interface CrossRefItem {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string; family?: string }>
  published?: { "date-parts"?: number[][] }
  publisher?: string
  "container-title"?: string[]
  URL?: string
  abstract?: string
  type?: string
  [key: string]: unknown
}

interface LiteratureResult {
  doi: string | null
  title: string
  author: string
  year: number | null
  source: string
  url: string
  abstract: string | null
  type: string
}

const SEARCH_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 10 * 60 * 1000 // 10 menit
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000

// Periodic cache cleanup — sekali aja via globalThis
if (typeof globalThis !== "undefined" && !(globalThis as any).__searchCacheCleanup) {
  ;(globalThis as any).__searchCacheCleanup = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of SEARCH_CACHE) {
      if (now - entry._ts > CACHE_TTL) {
        SEARCH_CACHE.delete(key)
      }
    }
  }, CACHE_CLEANUP_INTERVAL)
}

function makeCacheKey(query: string, journalOnly: boolean): string {
  return `${query.toLowerCase().trim()}|${journalOnly}`
}

/**
 * Hitung similarity score antara dua string (0-1)
 */
function stringSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  const bWords = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  if (aWords.size === 0 || bWords.size === 0) return 0
  let overlap = 0
  for (const word of aWords) {
    if (bWords.has(word)) overlap++
  }
  return overlap / Math.min(aWords.size, bWords.size)
}

/**
 * Deduplikasi: hapus artikel duplikat berdasarkan DOI atau judul+penulis+tahun mirip
 */
function deduplicateResults(items: LiteratureResult[]): LiteratureResult[] {
  const seen = new Set<string>()
  const unique: LiteratureResult[] = []

  for (const item of items) {
    if (item.doi && seen.has(`doi:${item.doi}`)) continue

    const authorNorm = item.author.toLowerCase().slice(0, 50)
    let isDuplicate = false
    for (const existing of unique) {
      if (
        item.year &&
        existing.year &&
        Math.abs(item.year - existing.year) <= 1 &&
        authorNorm === existing.author.toLowerCase().slice(0, 50) &&
        stringSimilarity(item.title, existing.title) > 0.7
      ) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      if (item.doi) seen.add(`doi:${item.doi}`)
      unique.push(item)
    }
  }

  return unique
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const pageSize = 10
  const journalOnly = searchParams.get("journalOnly") === "true"

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const cacheKey = makeCacheKey(query, journalOnly)
    let cached = SEARCH_CACHE.get(cacheKey)

    // Fetch dari CrossRef hanya sekali (page 0 atau cache expired)
    if (!cached || page === 0) {
      let searchQuery = query
      try {
        const keywordsRes = await extractSearchKeywords(query)
        if (keywordsRes && keywordsRes !== "fallback" && keywordsRes.length < 200) {
          searchQuery = keywordsRes
          console.log(`[Search] "${query}" → keywords: "${searchQuery}"`)
        }
      } catch {
        // Fallback ke query asli
      }

      // Ambil 200 hasil dari CrossRef (cukup untuk ~20 halaman)
      const url = new URL("https://api.crossref.org/works")
      url.searchParams.set("query", query)
      url.searchParams.set("query.title", searchQuery)
      url.searchParams.set("rows", "200")
      url.searchParams.set("offset", "0")
      url.searchParams.set("sort", "relevance")
      url.searchParams.set("mailto", "thesisai@app")

      if (journalOnly) {
        url.searchParams.set(
          "filter",
          "type:journal-article,type:proceedings-article,type:book-chapter,type:book,type:monograph"
        )
      }

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)" },
      })

      if (!res.ok) {
        throw new Error(`CrossRef responded ${res.status}`)
      }

      const data = await res.json()
      const items: CrossRefItem[] = data.message?.items ?? []
      const totalItems = data.message?.["total-items"] ?? 0

      // Transform
      let results: LiteratureResult[] = items
        .map((item: CrossRefItem) => ({
          doi: item.DOI ?? null,
          title: item.title?.[0] ?? "No title",
          author: item.author
            ? item.author.map((a) => `${a.given ?? ""} ${a.family ?? ""}`.trim()).join(", ")
            : "Unknown",
          year: item.published?.["date-parts"]?.[0]?.[0] ?? null,
          source: item.publisher ?? item["container-title"]?.[0] ?? "",
          url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : ""),
          abstract: item.abstract ?? null,
          type: item.type ?? "article",
        }))
        .filter((item) => item.title !== "No title")

      results = deduplicateResults(results)

      SEARCH_CACHE.set(cacheKey, { results, totalItems, searchQuery, _ts: Date.now() })
      cached = SEARCH_CACHE.get(cacheKey)!
    }

    // Slice dari cache — semua page dari hasil yang SAMA
    const startIdx = page * pageSize
    const pageResults = cached.results.slice(startIdx, startIdx + pageSize)
    const totalFiltered = cached.results.length

    // Breakdown type
    const typeBreakdown: Record<string, number> = {}
    for (const item of pageResults) {
      typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1
    }

    return NextResponse.json({
      results: pageResults,
      total: pageResults.length,
      totalFiltered,
      totalItems: cached.totalItems,
      totalApi: 200,
      page,
      rows: pageSize,
      searchQuery: cached.searchQuery,
      typeBreakdown,
    })
  } catch (error) {
    console.error("CrossRef search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel. Coba lagi nanti." },
      { status: 500 },
    )
  }
}