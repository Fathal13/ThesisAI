import { NextResponse } from "next/server"
import { extractSearchKeywords } from "@/lib/ai"

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

/**
 * Hitung similarity score antara dua string (0-1)
 * Sederhana: cek overlap kata
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
 * Deduplikasi: hapus artikel yang sama persis berdasarkan:
 * 1. DOI sama
 * 2. Judul sangat mirip (>70% overlap) + penulis sama + tahun sama
 */
function deduplicateResults(items: LiteratureResult[]): LiteratureResult[] {
  const seen = new Set<string>()
  const unique: LiteratureResult[] = []

  for (const item of items) {
    // Cek DOI
    if (item.doi && seen.has(`doi:${item.doi}`)) continue

    // Cek kombinasi judul + penulis + tahun
    const authorNorm = item.author.toLowerCase().slice(0, 50)

    // Cari duplikat berdasarkan kemiripan
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

/**
 * Cek apakah artikel relevan dengan query user — LENIENT
 * Biarkan CrossRef yang handle relevansi via scoring.
 * Fungsi ini hanya filter kasar untuk artikel yang benar-benar tidak relevan.
 * Penting: jangan terlalu strict agar artikel Bahasa Indonesia tidak ikut terfilter.
 */
function isRelevant(item: LiteratureResult, queryTerms: string[]): boolean {
  if (queryTerms.length === 0) return true

  const searchText = `${item.title} ${item.abstract ?? ""}`.toLowerCase()

  // Cari minimal 1 term dari query ASLI (bukan AI keywords Inggris) yang cocok
  const matches = queryTerms.filter((term) => {
    const normalizedTerm = term.toLowerCase().replace(/^["']|["']$/g, "").trim()
    if (normalizedTerm.length <= 3) return true
    return searchText.includes(normalizedTerm)
  })

  // Sangat lenient: butuh minimal 1 match dari term >3 karakter
  const meaningfulTermCount = queryTerms.filter((t) => t.replace(/^["']|["']$/g, "").length > 3).length
  return matches.length >= Math.min(1, meaningfulTermCount)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  // Ambil lebih banyak (40) supaya bisa banyak halaman & filter relevansi ketat
  const rows = 40
  // Filter jurnal saja: journal-article, proceedings-article, book-chapter, book, monograph
  const journalOnly = searchParams.get("journalOnly") === "true"

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    // === Langkah 1: Ekstrak kata kunci dari AI ===
    let searchQuery = query
    try {
      const keywordsRes = await extractSearchKeywords(query)
      if (keywordsRes && keywordsRes !== "fallback" && keywordsRes.length < 200) {
        searchQuery = keywordsRes
        console.log(`[Search] Original: "${query}" → Keywords: "${searchQuery}"`)
      }
    } catch {
      // Fallback: pakai query asli
      console.log(`[Search] AI extraction failed, using original: "${query}"`)
    }

    // Ekstrak term individual untuk filtering (gabungkan AI keywords + query asli)
    const originalTerms = query.split(/\s+/).filter((w) => w.length > 4)
    const aiTerms = searchQuery
      .split(/AND|OR|&&|\|\|/i)
      .map((t) => t.trim())
      .filter(Boolean)
    const queryTerms = [...new Set([...aiTerms, ...originalTerms])] // unique

    // === Langkah 2: Panggil CrossRef ===
    const url = new URL("https://api.crossref.org/works")
    // Gunakan query umum (bukan query.title spesifik) agar lebih luas & inklusif Indonesia
    // query = cari di judul, abstrak, author, publisher, dll.
    url.searchParams.set("query", query)
    // Tambahkan query.title sebagai boost untuk artikel dengan judul sangat cocok
    url.searchParams.set("query.title", searchQuery)
    url.searchParams.set("rows", String(rows))
    url.searchParams.set("offset", String(page * rows))
    url.searchParams.set("sort", "relevance")
    // Polite pool
    url.searchParams.set("mailto", "thesisai@app")

    // Filter tipe publikasi jika journalOnly
    if (journalOnly) {
      // CrossRef types: journal-article, proceedings-article, book-chapter, book, monograph, reference-entry, dataset, etc.
      url.searchParams.set(
        "filter",
        "type:journal-article,type:proceedings-article,type:book-chapter,type:book,type:monograph"
      )
    }

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)" },
    })

    if (!res.ok) {
      throw new Error(`CrossRef API responded with ${res.status}`)
    }

    const data = await res.json()
    const items: CrossRefItem[] = data.message?.items ?? []
    // Total available from CrossRef (bisa ribuan)
    const totalItems = data.message?.["total-items"] ?? 0

    // === Langkah 3: Transform & Filter ===
    let results: LiteratureResult[] = items
      .map((item: CrossRefItem) => ({
        doi: item.DOI ?? null,
        title: item.title?.[0] ?? "No title",
        author: item.author
          ? item.author
              .map((a) => `${a.given ?? ""} ${a.family ?? ""}`.trim())
              .join(", ")
          : "Unknown",
        year: item.published?.["date-parts"]?.[0]?.[0] ?? null,
        source: item.publisher ?? item["container-title"]?.[0] ?? "",
        url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : ""),
        abstract: item.abstract ?? null,
        type: item.type ?? "article",
      }))
      .filter((item) => item.title !== "No title") // hapus yang tanpa judul
      .filter((item) => isRelevant(item, queryTerms)) // filter relevansi

    // === Langkah 4: Deduplikasi ===
    results = deduplicateResults(results)

    // Hitung breakdown by type untuk info ke user
    const typeBreakdown: Record<string, number> = {}
    for (const item of results) {
      typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1
    }

    // Batasi hasil ke max 10 per page untuk ditampilkan
    const displayResults = results.slice(0, 10)

    return NextResponse.json({
      results: displayResults,
      total: displayResults.length, // hasil di halaman ini (max 10)
      totalFiltered: results.length, // total setelah filter & dedup
      totalItems, // total tersedia di CrossRef (bisa ribuan)
      totalApi: items.length, // item yang di-fetch API ini (max 40)
      page,
      rows: 10,
      searchQuery, // kirim balik keyword yang dipakai
      typeBreakdown, // breakdown by type untuk info user
    })
  } catch (error) {
    console.error("CrossRef search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel. Coba lagi nanti." },
      { status: 500 },
    )
  }
}