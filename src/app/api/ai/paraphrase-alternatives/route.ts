import { NextResponse } from "next/server"
import { generateParaphraseAlternatives } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { originalText, paraphrasedText, changedWords } = await req.json()

    if (!originalText || !paraphrasedText || !changedWords) {
      return NextResponse.json(
        { error: "originalText, paraphrasedText, dan changedWords diperlukan" },
        { status: 400 },
      )
    }

    if (!Array.isArray(changedWords)) {
      return NextResponse.json({ error: "changedWords harus array" }, { status: 400 })
    }

    // Limit jumlah kata untuk diproses (maks 20 kata per request)
    const limitedWords = changedWords.slice(0, 20)

    const alternatives = await generateParaphraseAlternatives(
      originalText,
      paraphrasedText,
      limitedWords,
    )

    return NextResponse.json({ alternatives })
  } catch (error) {
    console.error("Paraphrase alternatives error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil alternatif kata. Coba lagi nanti." },
      { status: 500 },
    )
  }
}