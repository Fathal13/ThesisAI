import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { judulBab, konten } = await req.json()

  if (!judulBab || !konten) {
    return NextResponse.json({ error: "Judul dan konten diperlukan" }, { status: 400 })
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
Anda adalah korektor akademik untuk skripsi mahasiswa Indonesia.
Review bagian "${judulBab}" berikut dan berikan saran perbaikan.

Konten:
${konten}

Berikan output JSON (tanpa markdown):
{
  "grammar": ["Kesalahan tata bahasa yang ditemukan..."],
  "wordChoice": ["Rekomendasi kata lebih formal..."],
  "structure": ["Masalah struktur atau logika penulisan..."],
  "clarity": ["Kalimat ambigu atau perlu diperjelas..."]
}

Maksimal 3 poin per kategori. Gunakan Bahasa Indonesia.
Jika tidak ada masalah, kembalikan array kosong [].
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```(json)?\n?/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        grammar: ["Gagal mem-parsing hasil AI"],
        wordChoice: [],
        structure: [],
        clarity: [],
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI review error:", error)
    return NextResponse.json(
      { error: "Gagal mereview tulisan. Coba lagi nanti." },
      { status: 500 }
    )
  }
}