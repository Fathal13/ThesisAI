import { NextResponse } from "next/server"
import { reviewWriting } from "@/lib/ai"

export async function POST(req: Request) {
  const { judulBab, konten } = await req.json()

  if (!judulBab || !konten) {
    return NextResponse.json({ error: "Judul dan konten diperlukan" }, { status: 400 })
  }

  try {
    const result = await reviewWriting(judulBab, konten)
    return NextResponse.json(result)
  } catch (error) {
    console.error("AI review error:", error)
    return NextResponse.json(
      { error: "Gagal mereview tulisan. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
