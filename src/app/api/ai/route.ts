import { NextResponse } from "next/server"
import {
  summarizeLiterature,
  reviewWriting,
  generateSidangQuestions,
  generateMotivation,
  getActiveProvider,
  AIAllProvidersFailedError,
  AIRateLimitError,
  AITimeoutError,
} from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json()

    let result: unknown
    let expectJson = true

    switch (action) {
      case "summarize":
        result = await summarizeLiterature(data.title, data.abstract ?? "")
        break

      case "review":
        result = await reviewWriting(data.judulBab, data.konten)
        break

      case "sidang":
        result = await generateSidangQuestions(data.kontenBab, data.judulSkripsi)
        break

      case "motivasi":
        result = { text: await generateMotivation(data.progress, data.nama) }
        expectJson = false
        break

      case "provider-status":
        // Endpoint untuk cek provider aktif dari client
        return NextResponse.json({ provider: getActiveProvider() })

      default:
        return NextResponse.json({ error: "Action not recognized" }, { status: 400 })
    }

    if (!expectJson) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI API Error:", error)

    if (error instanceof AIAllProvidersFailedError) {
      // error.message mengandung detail provider & API key status — jangan dikirim ke client
      const total = error.errors.length
      return NextResponse.json(
        {
          error: `Fitur AI sedang sibuk (${total}/${total} provider gagal). Coba lagi nanti.`,
          action: "check-api-keys",
        },
        { status: 503 },
      )
    }

    if (error instanceof AIRateLimitError) {
      return NextResponse.json(
        {
          error: `Kuota ${error.provider} sedang habis. Semua provider juga gagal. Coba lagi nanti.`,
          provider: error.provider,
        },
        { status: 429 },
      )
    }

    if (error instanceof AITimeoutError) {
      return NextResponse.json(
        {
          error: `Provider ${error.provider} tidak merespon. Coba lagi.`,
          provider: error.provider,
        },
        { status: 504 },
      )
    }

    return NextResponse.json(
      { error: "Gagal memproses permintaan AI. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
