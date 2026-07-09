import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { title, abstract } = await req.json()

  if (!title) {
    return NextResponse.json({ error: "Judul diperlukan" }, { status: 400 })
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
Anda adalah asisten akademik yang membantu mahasiswa merangkum artikel ilmiah.
Berdasarkan judul dan abstrak berikut, buat ringkasan terstruktur dalam Bahasa Indonesia.

Judul: ${title}
Abstrak: ${abstract ?? "Tidak tersedia"}

Format JSON (jangan pakai markdown):
{
  "problem": "Masalah yang diangkat (1-2 kalimat)",
  "method": "Metode yang digunakan (1-2 kalimat)",
  "result": "Hasil utama (1-2 kalimat)",
  "gap": "Kesenjangan riset atau saran untuk riset selanjutnya (1 kalimat)"
}
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```(json)?\n?/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Jika parsing gagal, return text mentah
      parsed = { problem: text, method: "", result: "", gap: "" }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI summarize error:", error)
    return NextResponse.json(
      { error: "Gagal merangkum artikel. Coba lagi nanti." },
      { status: 500 }
    )
  }
}
