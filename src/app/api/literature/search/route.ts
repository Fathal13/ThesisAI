import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const rows = 10

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const url = new URL("https://api.crossref.org/works")
    url.searchParams.set("query", query)
    url.searchParams.set("rows", String(rows))
    url.searchParams.set("offset", String(page * rows))
    url.searchParams.set("sort", "relevance")
    // Polite pool: sertakan email
    url.searchParams.set("mailto", "thesisai@app")

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)" },
    })

    if (!res.ok) {
      throw new Error(`CrossRef API responded with ${res.status}`)
    }

    const data = await res.json()
    const items = data.message?.items ?? []

    const results = items.map((item: Record<string, any>) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      doi: item.DOI ?? null,
      title: item.title?.[0] ?? "No title",
      author: item.author
        ? item.author.map((a: Record<string, any>) => `${a.given ?? ""} ${a.family ?? ""}`.trim()).join(", ") // eslint-disable-line @typescript-eslint/no-explicit-any
        : "Unknown",
      year: item.published?.["date-parts"]?.[0]?.[0] ?? null,
      source: item.publisher ?? item["container-title"]?.[0] ?? "",
      url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      abstract: item.abstract ?? null,
      type: item.type ?? "article",
    }))

    return NextResponse.json({
      results,
      total: data.message?.["total-results"] ?? 0,
      page,
      rows,
    })
  } catch (error) {
    console.error("CrossRef search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel. Coba lagi nanti." },
      { status: 500 }
    )
  }
}
