import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"
import { extractSearchKeywords } from "@/lib/ai"

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
    const { results, total } = await searchOpenAlex(searchQuery, page, perPage, journalOnly)

    const totalPages = Math.ceil(total / perPage)
    const showingCount = Math.min(perPage, total - page * perPage)

    return NextResponse.json({
      results,
      total,
      totalPages,
      page,
      perPage,
      searchQuery,
      showing: Math.max(0, showingCount),
      journalOnly,
      message: total > 0
        ? `Menampilkan ${showingCount} dari ${total.toLocaleString("id-ID")} artikel Open Access${journalOnly ? " (jurnal saja)" : ""} (halaman ${page + 1} dari ${totalPages})`
        : "Tidak ada artikel ditemukan",
    })
  } catch (error) {
    console.error("OpenAlex search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel Open Access. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
