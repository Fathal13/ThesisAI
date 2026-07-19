import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { checkLoginRateLimit, checkSignupRateLimit, checkRateLimit } from "@/lib/rate-limit"

const CSRF_TOKEN_NAME = "csrf_token"

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password minimal 8 karakter."
  if (password.length > 128) return "Password maksimal 128 karakter."
  if (!/[A-Z]/.test(password)) return "Harus mengandung minimal 1 huruf kapital."
  if (!/[a-z]/.test(password)) return "Harus mengandung minimal 1 huruf kecil."
  if (!/[0-9]/.test(password)) return "Harus mengandung minimal 1 angka."
  if (!/[^A-Za-z0-9]/.test(password)) return "Harus mengandung minimal 1 karakter spesial."
  return null
}

function validateEmail(email: string): string | null {
  if (!email || email.length > 254) return "Email tidak valid."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid."
  if (/['"<>(){}]/.test(email)) return "Email mengandung karakter tidak valid."
  return null
}

function auditLog(action: string, emailHash: string, ipHash: string, status: "success" | "failure") {
  console.log(
    JSON.stringify({
      level: "audit",
      timestamp: new Date().toISOString(),
      action,
      email: emailHash,
      ip: ipHash,
      status,
    })
  )
}

function hashIdentifier(value: string): string {
  // Hashing sederhana untuk log — bukan kriptografis, cukup mencegah PII mentah di log
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(36)}`
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type harus application/json" }, { status: 415 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 })
    }

    const action = body.action as string | undefined
    const email = ((body.email as string) ?? "").trim()
    const password = (body.password as string) ?? ""

    if (!action || !["signin", "signup", "signout", "resend-confirmation", "forgot-password", "reset-password"].includes(action)) {
      return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
    }

    // ───── CSRF ─────
    // Terapkan CSRF check untuk SEMUA action yang mutation (signin, signup,
    // forgot-password, reset-password, resend-confirmation, signout) —
    // cegah attacker memicu action auth tanpa sepengetahuan user.
    const csrfProtectedActions: typeof action[] = [
      "signin", "signup", "forgot-password", "reset-password",
      "resend-confirmation", "signout",
    ]
    if (action && csrfProtectedActions.includes(action)) {
      const csrfCookie = request.cookies.get(CSRF_TOKEN_NAME)?.value
      const csrfHeader = request.headers.get("x-csrf-token")
      if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
        console.warn(`[CSRF] Token mismatch`)
        return NextResponse.json({ error: "Request tidak valid." }, { status: 403 })
      }
    }

    // ───── Supabase client pakai cookies() dari next/headers ─────
    // @supabase/ssr v0.12: getAll()/setAll() menangani cookie chunking dengan benar
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          },
        },
      }
    )

    // ───── Helper ─────
    function respond(data: unknown, status = 200) {
      // Setelah cookieStore.set() dipanggil, Next.js secara otomatis
      // menyertakan cookie tsb ke response headers di Route Handler.
      return NextResponse.json(data, { status })
    }

    // ───── Sign out ─────
    if (action === "signout") {
      await supabase.auth.signOut()
      return respond({ success: true })
    }

    // ───── Resend confirmation ─────
    if (action === "resend-confirmation") {
      const normalizedEmail = email.toLowerCase()
      const emailErr = validateEmail(normalizedEmail)
      if (emailErr) return respond({ error: emailErr }, 400)

      // Rate limit: max 3 request per email per hour
      const resendCheck = await checkRateLimit(`resend:${normalizedEmail}`, 3, 3_600_000)
      if (!resendCheck.allowed) {
        return respond({ error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfter: Math.ceil(resendCheck.resetIn / 1000) }, 429)
      }

      const { error } = await supabase.auth.resend({ type: "signup", email: normalizedEmail })
      if (error) return respond({ error: "Gagal mengirim ulang email. Coba lagi nanti." }, 500)

      return respond({ message: "✅ Email konfirmasi sudah dikirim ulang!" })
    }

    // ───── Forgot password / Reset password ─────
    if (action === "forgot-password") {
      const emailErr = validateEmail(email)
      if (emailErr) return respond({ error: emailErr }, 400)

      const normalizedEmail = email.toLowerCase()

      // Rate limit: max 2 request per email per hour (prevent email spam)
      const forgotCheck = await checkRateLimit(`forgot:${normalizedEmail}`, 2, 3_600_000)
      if (!forgotCheck.allowed) {
        return respond({ error: "Terlalu banyak permintaan reset. Coba lagi nanti.", retryAfter: Math.ceil(forgotCheck.resetIn / 1000) }, 429)
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${request.nextUrl.origin}/auth/login?reset=true`,
      })

      // Always return success (prevent email enumeration)
      if (error) {
        auditLog("forgot-password", hashIdentifier(normalizedEmail), hashIdentifier(ip), "failure")
        console.error("[Auth] Forgot password error occurred")
      } else {
        auditLog("forgot-password", hashIdentifier(normalizedEmail), hashIdentifier(ip), "success")
      }

      return respond({
        message: "📧 Kalau email terdaftar, link reset password sudah dikirim! Cek inbox & folder SPAM.",
      })
    }

    if (action === "reset-password") {
      const passwordError = validatePassword(password)
      if (passwordError) return respond({ error: passwordError }, 400)

      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        auditLog("reset-password", hashIdentifier("user"), hashIdentifier(ip), "failure")
        console.error("[Auth] Reset password error occurred")
        return respond({ error: "Gagal reset password. Coba lagi nanti." }, 500)
      }

      auditLog("reset-password", hashIdentifier("user"), hashIdentifier(ip), "success")
      return respond({ message: "✅ Password berhasil diubah! Silakan login." })
    }

    // ───── Email & password validation ─────
    if (!email || !password) return respond({ error: "Email dan password harus diisi." }, 400)
    const emailError = validateEmail(email)
    if (emailError) return respond({ error: emailError }, 400)

    if (action === "signup") {
      const passwordError = validatePassword(password)
      if (passwordError) return respond({ error: passwordError }, 400)
    }

    const normalizedEmail = email.toLowerCase()

    // ───── Rate limit ─────
    if (action === "signin") {
      const limitCheck = await checkLoginRateLimit(ip, email)
      if (!limitCheck.allowed) return respond({ error: limitCheck.reason, retryAfter: limitCheck.retryAfter }, 429)
    }
    if (action === "signup") {
      const limitCheck = await checkSignupRateLimit(ip)
      if (!limitCheck.allowed) return respond({ error: limitCheck.reason }, 429)
    }

    // ───── Sign in ─────
    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        auditLog("signin", hashIdentifier(normalizedEmail), hashIdentifier(ip), "failure")
        if (
          error.message.includes("Email not confirmed") ||
          error.message.includes("email not confirmed")
        ) {
          return respond(
            {
              error:
                "Email belum dikonfirmasi. Cek inbox & SPAM, lalu klik link konfirmasi. Atau klik 'Kirim Ulang Email Konfirmasi' di bawah.",
            },
            401
          )
        }
        return respond({ error: "Email atau password salah." }, 401)
      }

      auditLog("signin", hashIdentifier(normalizedEmail), hashIdentifier(ip), "success")
      // Kirim data minimal — jangan ekspos seluruh user/session object mentah
      return respond({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          nama: data.user?.user_metadata?.nama ?? null,
        },
      })
    }

    // ───── Sign up ─────
    if (action === "signup") {
      const nama = ((body.nama as string) ?? "").trim()
      if (!nama || nama.length < 2 || nama.length > 100)
        return respond({ error: "Nama harus diisi (2-100 karakter)." }, 400)
      if (/[<>{}$]/.test(nama)) return respond({ error: "Nama mengandung karakter tidak valid." }, 400)

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { nama } },
      })

      if (error) {
        auditLog("signup", hashIdentifier(normalizedEmail), hashIdentifier(ip), "failure")
        // Gunakan pesan generik untuk mencegah email enumeration
        if (error.message.includes("already")) {
          return respond({
            user: null,
            session: null,
            message: "✅ Pendaftaran berhasil! Cek email kamu untuk konfirmasi.",
            confirmationSent: true,
          })
        }
        return respond({ error: "Gagal mendaftar. Coba lagi nanti." }, 500)
      }

      auditLog("signup", hashIdentifier(normalizedEmail), hashIdentifier(ip), "success")

      // Email konfirmasi standar — user harus konfirmasi sebelum bisa akses dashboard
      return respond({
        user: null,
        session: null,
        message: "📧 Email konfirmasi sudah dikirim! Cek inbox dan folder SPAM. Link berlaku 24 jam.",
        confirmationSent: true,
      })
    }

    return respond({ error: "Action tidak dikenal" }, 400)
  } catch (error) {
    console.error("Auth API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 })
  }
}
