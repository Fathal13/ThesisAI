import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"

// ─── In-memory search cache ───
// Hash(query + journalOnly) → { results, total, _ts }
// Cache TTL 10 menit, cleanup tiap 5 menit.
// Tujuannya: page 0 fetch 200 artikel, cache, lalu semua page slice dari cache yang sama.
// Post-filter keyword match jalan sekali di cache entry, bukan tiap page.

interface CacheEntry {
  allResults: Awaited<ReturnType<typeof searchOpenAlex>>["results"]
  total: number
  _ts: number
}

const SEARCH_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL = 10 * 60 * 1000 // 10 menit
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000

// Periodic cache cleanup — sekali aja via globalThis
if (typeof globalThis !== "undefined" && !(globalThis as Record<string, unknown>).__openalexCacheCleanup) {
  ;(globalThis as Record<string, unknown>).__openalexCacheCleanup = true
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
 * Tokenisasi query: pecah jadi kata-kata individual, buang karakter non-alfanumerik
 */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;.()"\-/:]+/)
    .filter((word) => word.length >= 2)
}

/**
 * Filter hasil agar hanya artikel yang:
 * - Judulnya mengandung minimal SATU token dari query user (bukan exact phrase)
 * - ATAU nama jurnal/sumbernya mengandung minimal SATU token
 *
 * Dilonggarkan: token cukup 2+ karakter (bukan 3) dan tanpa stop words list,
 * karena OpenAlex relevance + user intent sudah cukup sebagai signal.
 */
function filterByTokenMatch(
  results: Awaited<ReturnType<typeof searchOpenAlex>>["results"],
  query: string,
): typeof results {
  const tokens = tokenize(query)

  // Kalau hasil tokenisasi kosong, kembalikan semua
  if (tokens.length === 0) return results

  return results.filter((item) => {
    const title = item.title?.toLowerCase() ?? ""
    const source = item.source?.toLowerCase() ?? ""

    return tokens.some((token) => title.includes(token) || source.includes(token))
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawQuery = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const perPage = Number(searchParams.get("perPage")) || 20
  const journalOnly = searchParams.get("journalOnly") === "true"

  if (!rawQuery || rawQuery.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const cacheKey = makeCacheKey(rawQuery, journalOnly)
    let cached = SEARCH_CACHE.get(cacheKey)

    // Refresh cache tiap page 0 (pencarian baru)
    if (!cached || page === 0) {
      console.log(`[OpenAlex Cache] Fetching 200 articles for "${rawQuery}"`)
      const { results, total } = await searchOpenAlex(rawQuery, 0, 200, journalOnly)

      // Post-filter: pastikan judul/sumber mengandung token dari query user
      const filtered = filterByTokenMatch(results, rawQuery)

      SEARCH_CACHE.set(cacheKey, { allResults: filtered, total, _ts: Date.now() })
      cached = SEARCH_CACHE.get(cacheKey)!
    }

    const allResults = cached.allResults
    const totalFromApi = cached.total
    const filteredTotal = allResults.length
    const totalPages = Math.ceil(filteredTotal / perPage)
    const startIdx = page * perPage
    const pageResults = allResults.slice(startIdx, startIdx + perPage)
    const showingCount = pageResults.length

    return NextResponse.json({
      results: pageResults,
      total: filteredTotal,
      totalApi: totalFromApi,
      totalPages,
      page,
      perPage,
      journalOnly,
      showing: showingCount,
      message:
        filteredTotal > 0
          ? `Menampilkan ${showingCount} dari ${filteredTotal.toLocaleString("id-ID")} artikel yang sesuai${journalOnly ? " (jurnal saja)" : ""} (halaman ${page + 1} dari ${totalPages})`
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
