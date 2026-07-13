import { NextResponse } from "next/server"
import { searchOpenAlex } from "@/lib/openalex"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const page = Number(searchParams.get("page")) || 0
  const perPage = Number(searchParams.get("perPage")) || 20

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Minimal 3 karakter" }, { status: 400 })
  }

  try {
    const { results, total } = await searchOpenAlex(q, page, perPage)
    return NextResponse.json({
      results,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error("OpenAlex search error:", error)
    return NextResponse.json(
      { error: "Gagal mencari artikel Open Access. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
