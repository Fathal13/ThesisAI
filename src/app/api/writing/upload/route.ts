import { NextResponse } from "next/server"
import mammoth from "mammoth"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar. Maks 5MB." }, { status: 400 })
    }

    // Validasi tipe file
    const allowedTypes = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan .docx atau .txt" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text = ""

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Parse .docx dengan mammoth
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      // Parse .txt
      text = new TextDecoder("utf-8").decode(buffer)
    }

    // Bersihkan teks: hapus newline berlebihan, trim
    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()

    if (!text) {
      return NextResponse.json({ error: "File kosong atau tidak bisa dibaca" }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[Writing Upload] Error:", error)
    return NextResponse.json({ error: "Gagal memproses file" }, { status: 500 })
  }
}