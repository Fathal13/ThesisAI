import { NextResponse } from "next/server"
import { paraphraseText, type ParaphraseStyle } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { text, style } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Teks diperlukan" }, { status: 400 })
    }

    if (!style || !["akademik", "lebih-formal", "ubah-struktur"].includes(style)) {
      return NextResponse.json({ error: "Gaya tidak valid" }, { status: 400 })
    }

    // Limit ukuran teks (max 5000 karakter ≈ ~1000 kata)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Teks terlalu panjang (maks 5000 karakter). Proses per paragraf." },
        { status: 400 },
      )
    }

    const result = await paraphraseText(text, style as ParaphraseStyle)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Paraphrase error:", error)
    return NextResponse.json(
      { error: "Gagal memparafrase. Coba lagi nanti." },
      { status: 500 },
    )
  }
}