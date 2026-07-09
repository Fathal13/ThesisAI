import { NextResponse } from "next/server"
import { generateSidangQuestions } from "@/lib/ai"

export async function POST(req: Request) {
  const { kontenBab, judulSkripsi } = await req.json()

  if (!kontenBab || !judulSkripsi) {
    return NextResponse.json({ error: "Konten bab dan judul skripsi diperlukan" }, { status: 400 })
  }

  try {
    const result = await generateSidangQuestions(kontenBab, judulSkripsi)
    return NextResponse.json(result)
  } catch (error) {
    console.error("AI sidang error:", error)
    return NextResponse.json(
      { error: "Gagal generate pertanyaan sidang. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
