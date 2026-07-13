import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"
import { extractSearchKeywords } from "@/lib/ai"

/**
 * Stop words umum (Indonesia + Inggris) yang tidak signifikan untuk filter judul
 */
const STOP_WORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "dengan", "pada", "ini", "itu", "untuk",
  "dalam", "adalah", "telah", "akan", "tidak", "saya", "kami", "kita", "mereka",
  "anda", "atau", "tetapi", "namun", "karena", "sebagai", "oleh", "sebuah",
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "were",
  "been", "have", "has", "had", "more", "about", "than", "also", "its",
  "other", "such", "into", "can", "may", "each", "between", "very", "over",
  "penelitian", "study", "studies", "analysis", "pengaruh", "pada", "yang",
  "review", "systematic", "literature", "approach", "method", "based",
])

/**
 * Ekstrak kata kunci signifikan dari input user (exclude stop words & kata pendek)
 */
function extractSignificantKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;.()"]+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
}

/**
 * Filter hasil agar hanya artikel yang:
 * - Judulnya mengandung minimal SATU kata kunci signifikan, ATAU
 * - Nama jurnal/sumbernya mengandung minimal SATU kata kunci signifikan
 */
function filterByKeywordMatch(
  results: Awaited<ReturnType<typeof searchOpenAlex>>["results"],
  query: string,
): typeof results {
  const keywords = extractSignificantKeywords(query)

  // Kalau gak ada kata kunci signifikan (misal cuma "the" doang), lempar semua
  if (keywords.length === 0) return results

  return results.filter((item) => {
    const title = item.title?.toLowerCase() ?? ""
    const source = item.source?.toLowerCase() ?? ""

    return keywords.some((kw) => title.includes(kw) || source.includes(kw))
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const perPage = Number(searchParams.get("perPage")) || 20
  const journalOnly = searchParams.get("journalOnly") === "true"

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  // Ekstrak kata kunci dari query panjang user
  let searchQuery = q
  try {
    const keywordsRes = await extractSearchKeywords(q)
    if (keywordsRes && keywordsRes !== "fallback" && keywordsRes.length < 200) {
      searchQuery = keywordsRes
      console.log(`[OpenAlex Search] "${q}" → keywords: "${searchQuery}"`)
    }
  } catch {
    // Fallback ke query asli
  }

  try {
    // Ambil lebih banyak dari OpenAlex biar hasil filtering tetap banyak
    const fetchPerPage = Math.min(perPage * 3, 100)
    const { results, total } = await searchOpenAlex(searchQuery, page, fetchPerPage, journalOnly)

    // Filter: judul atau nama jurnal harus mengandung minimal 1 kata kunci dari input user
    const filtered = filterByKeywordMatch(results, q)

    const filteredTotal = filtered.length
    const totalPages = Math.ceil(filteredTotal / perPage)
    const startIdx = 0
    const pageResults = filtered.slice(startIdx, startIdx + perPage)
    const showingCount = Math.min(perPage, filteredTotal)

    return NextResponse.json({
      results: pageResults,
      total: filteredTotal,
      totalPages,
      page,
      perPage,
      searchQuery,
      showing: Math.max(0, showingCount),
      journalOnly,
      message: filteredTotal > 0
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
