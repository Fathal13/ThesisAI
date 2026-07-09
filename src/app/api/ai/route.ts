import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    let prompt = ""
    let expectJson = true

    switch (action) {
      case "summarize":
        prompt = `
Anda adalah asisten akademik. Rangkum artikel berikut dalam Bahasa Indonesia:
Judul: ${data.title}
Abstrak: ${data.abstract}

Format JSON (tanpa markdown):
{
  "problem": "masalah yang diangkat (1-2 kalimat)",
  "method": "metode yang digunakan (1-2 kalimat)",
  "result": "hasil utama (1-2 kalimat)",
  "gap": "kesenjangan riset atau saran riset selanjutnya (1 kalimat)"
}`
        break

      case "review":
        prompt = `
Anda korektor skripsi. Review "${data.judulBab}":

${data.konten}

Format JSON (tanpa markdown):
{
  "grammar": ["Kesalahan tata bahasa..."],
  "wordChoice": ["Rekomendasi kata lebih formal..."],
  "structure": ["Masalah struktur atau logika..."],
  "clarity": ["Kalimat ambigu..."]
}
Maksimal 3 poin per kategori. Jika tidak ada masalah, array kosong [].`
        break

      case "sidang":
        prompt = `
Anda dosen penguji. Buat 10-15 pertanyaan sidang dari bab berikut.
Judul skripsi: ${data.judulSkripsi}

${data.kontenBab}

Format JSON array (tanpa markdown):
[
  {
    "question": "Pertanyaan sidang...",
    "category": "Metodologi | Teori | Hasil | Impak",
    "sampleAnswer": "Contoh jawaban ideal..."
  }
]
Kategorikan bervariasi. Gunakan Bahasa Indonesia. Jawaban akademik berbobot.`
        break

      case "motivasi":
        prompt = `Berikan 1 kalimat motivasi singkat Bahasa Indonesia untuk mahasiswa ${data.nama} yang sudah selesai ${data.progress}/5 bab skripsi. Santai tapi akademik.`
        expectJson = false
        break

      default:
        return NextResponse.json({ error: "Action not recognized" }, { status: 400 })
    }

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    if (!expectJson) {
      return NextResponse.json({ result: text.trim() })
    }

    // Parse JSON dengan error handling
    const cleaned = text.replace(/```(json)?\n?/g, "").trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Fallback if parsing fails
      parsed = { error: "Failed to parse AI response", raw: text }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI API Error:", error)
    return NextResponse.json({ error: "Gagal memproses permintaan AI" }, { status: 500 })
  }
}