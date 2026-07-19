import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"

const ADMIN_EMAIL = "alifatoni988@gmail.com"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: Request) {
  try {
    const { kategori, judul, deskripsi, email } = await req.json()

    if (!kategori || !judul || !deskripsi) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only */ },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 })
    }

    // Simpan ke DB
    const { error: dbError } = await supabase.from("feedbacks").insert({
      user_id: session.user.id,
      kategori,
      judul: judul.slice(0, 200),
      deskripsi,
      email: email || session.user.email,
    })

    if (dbError) {
      console.error("[Feedback] DB error:", dbError.message)
      return NextResponse.json({ error: "Gagal menyimpan keluhan" }, { status: 500 })
    }

    // Kirim email via Gmail (non-blocking)
    const nama = session.user.user_metadata?.nama ?? session.user.email
    transporter.sendMail({
      from: `"ThesisAI Feedback" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: (email || session.user.email) ?? undefined,
      subject: `[Keluhan] ${kategori} — ${judul.slice(0, 80)}`,
      text: `Dari: ${nama} (${email || session.user.email})

Kategori: ${kategori}
Judul: ${judul}

Deskripsi:
${deskripsi}`,
    }).catch(() => {/* email gagal — jangan crash response */})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Feedback] Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
