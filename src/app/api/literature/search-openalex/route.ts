import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"

// ─── In-memory search cache ───
// Hash(query + journalOnly) → { results, total, _ts }
// Cache TTL 10 menit, cleanup tiap 5 menit.
// Tujuannya: page 0 fetch 200 artikel dari OpenAlex (sudah relevan), cache,
// lalu semua page slice dari cache yang sama — konsisten tanpa fetch ulang.

interface CacheEntry {
  results: Awaited<ReturnType<typeof searchOpenAlex>>["results"]
  total: number
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const perPage = Number(searchParams.get("perPage")) || 20
  const journalOnly = searchParams.get("journalOnly") === "true"

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const cacheKey = makeCacheKey(query, journalOnly)
    let cached = SEARCH_CACHE.get(cacheKey)

    // Refresh cache hanya saat page 0 (pencarian baru)
    if (!cached || page === 0) {
      console.log(`[OpenAlex] Fetching 200 articles for "${query}"`)
      const { results, total } = await searchOpenAlex(query, 0, 200, journalOnly)
      SEARCH_CACHE.set(cacheKey, { results, total, _ts: Date.now() })
      cached = SEARCH_CACHE.get(cacheKey)!
    }

    const allResults = cached.results
    const totalApi = cached.total
    const startIdx = page * perPage
    const pageResults = allResults.slice(startIdx, startIdx + perPage)
    const showingCount = pageResults.length
    const totalPages = Math.ceil(allResults.length / perPage)

    return NextResponse.json({
      results: pageResults,
      total: allResults.length,
      totalApi,
      totalPages,
      page,
      perPage,
      journalOnly,
      showing: showingCount,
      message:
        allResults.length > 0
          ? `Menampilkan ${showingCount} dari ${allResults.length.toLocaleString("id-ID")} artikel Open Access${journalOnly ? " (jurnal saja)" : ""} (halaman ${page + 1} dari ${totalPages})`
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
