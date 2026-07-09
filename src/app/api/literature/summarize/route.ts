import { NextResponse } from "next/server"
import { summarizeLiterature } from "@/lib/ai"

export async function POST(req: Request) {
  const { title, abstract } = await req.json()

  if (!title) {
    return NextResponse.json({ error: "Judul diperlukan" }, { status: 400 })
  }

  try {
    const result = await summarizeLiterature(title, abstract ?? "Tidak tersedia")
    return NextResponse.json(result)
  } catch (error) {
    console.error("AI summarize error:", error)
    return NextResponse.json(
      { error: "Gagal merangkum artikel. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
