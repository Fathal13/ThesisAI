import { NextResponse } from "next/server"
import { extractSearchKeywords } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query || query.length < 3) {
      return NextResponse.json({ error: "Query minimal 3 karakter" }, { status: 400 })
    }

    const keywords = await extractSearchKeywords(query)
    return NextResponse.json({ keywords })
  } catch (error) {
    console.error("Extract keywords error:", error)
    // Fallback: return original query
    return NextResponse.json({ keywords: "fallback" }, { status: 500 })
  }
}