import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { kontenBab, judulSkripsi } = await req.json()

  if (!kontenBab || !judulSkripsi) {
    return NextResponse.json({ error: "Konten bab dan judul skripsi diperlukan" }, { status: 400 })
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
Anda adalah dosen penguji skripsi. Berdasarkan konten bab berikut dan judul skripsi,
buat 10-15 pertanyaan sidang yang paling mungkin ditanyakan.

Judul Skripsi: ${judulSkripsi}

Konten Bab:
${kontenBab}

Output JSON (array, tanpa markdown):
[
  {
    "question": "Pertanyaan sidang...",
    "category": "Metodologi | Teori | Hasil | Impak",
    "sampleAnswer": "Contoh jawaban ideal..."
  }
]

Buat bervariasi kategorinya. Gunakan Bahasa Indonesia. Berikan jawaban yang akademik dan berbobot.
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```(json)?\n?/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = []
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI sidang error:", error)
    return NextResponse.json(
      { error: "Gagal generate pertanyaan sidang. Coba lagi nanti." },
      { status: 500 }
    )
  }
}