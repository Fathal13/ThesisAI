import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"

const ADMIN_EMAIL = "alifatoni988@gmail.com"

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

    // Kirim email via Gmail
    // Transporter dibuat per-request — lebih stabil di Vercel serverless
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPass) {
      console.warn("[Feedback] GMAIL_USER atau GMAIL_APP_PASSWORD tidak dikonfigurasi")
      // Tetap return sukses — keluhan sudah tersimpan di DB
      return NextResponse.json({ success: true, note: "disimpan, email notif tidak dikirim (konfigurasi email belum lengkap)" })
    }

    const nama = session.user.user_metadata?.nama ?? session.user.email

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      })
      await transporter.sendMail({
        from: `"ThesisAI Feedback" <${gmailUser}>`,
        to: ADMIN_EMAIL,
        replyTo: (email || session.user.email) ?? undefined,
        subject: `[Keluhan] ${kategori} — ${judul.slice(0, 80)}`,
        text: `Dari: ${nama} (${email || session.user.email})

Kategori: ${kategori}
Judul: ${judul}

Deskripsi:
${deskripsi}`,
      })
    } catch (mailError) {
      // Log error email tapi jangan gagalkan response — keluhan sudah di DB
      console.error("[Feedback] Gagal kirim email:", mailError instanceof Error ? mailError.message : String(mailError))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Feedback] Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
