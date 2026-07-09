import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkLoginRateLimit, checkSignupRateLimit } from "@/lib/rate-limit"

const CSRF_TOKEN_NAME = "csrf_token"

function getClientIp(request: Request): string {
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

function auditLog(action: string, email: string, ip: string, status: "success" | "failure", detail?: string) {
  console.log(JSON.stringify({ level: "audit", timestamp: new Date().toISOString(), action, email: email.toLowerCase(), ip, status, detail }))
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type harus application/json" }, { status: 415 })
    }

    let body: Record<string, unknown>
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 })
    }

    const action = body.action as string | undefined
    const email = ((body.email as string) ?? "").trim()
    const password = (body.password as string) ?? ""

    if (!action || !["signin", "signup", "signout", "resend-confirmation"].includes(action)) {
      return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
    }

    // CSRF
    if (action === "signin" || action === "signup") {
      const cookieStore = await cookies()
      const csrfCookie = cookieStore.get(CSRF_TOKEN_NAME)?.value
      const csrfHeader = request.headers.get("x-csrf-token")
      if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
        console.warn(`[CSRF] Token mismatch from IP ${ip}`)
        return NextResponse.json({ error: "Request tidak valid." }, { status: 403 })
      }
    }

    // ───── Supabase client ─────
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" })
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, "", { ...options, maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" })
          },
        },
      },
    )

    // Helper untuk response — cookies otomatis terselip dari `cookies().set()` di atas
    function respond(data: unknown, status = 200) {
      try {
        return NextResponse.json(data, { status })
      } catch {
        return NextResponse.json(data, { status })
      }
    }

    // ───── Sign out ─────
    if (action === "signout") {
      await supabase.auth.signOut()
      return respond({ success: true })
    }

    // ───── Resend confirmation ─────
    if (action === "resend-confirmation") {
      const normalizedEmail = email.toLowerCase()
      const emailError = validateEmail(normalizedEmail)
      if (emailError) return respond({ error: emailError }, 400)

      const { error } = await supabase.auth.resend({ type: "signup", email: normalizedEmail })
      if (error) return respond({ error: "Gagal mengirim ulang email. Coba lagi nanti." }, 500)

      return respond({ message: "✅ Email konfirmasi sudah dikirim ulang!" })
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
      const limitCheck = checkLoginRateLimit(ip, email)
      if (!limitCheck.allowed) return respond({ error: limitCheck.reason, retryAfter: limitCheck.retryAfter }, 429)
    }
    if (action === "signup") {
      const limitCheck = checkSignupRateLimit(ip)
      if (!limitCheck.allowed) return respond({ error: limitCheck.reason }, 429)
    }

    // ───── Sign in ─────
    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })

      if (error) {
        auditLog("signin", normalizedEmail, ip, "failure", error.message)
        if (error.message.includes("Email not confirmed") || error.message.includes("email not confirmed")) {
          return respond({ error: "Email belum dikonfirmasi. Cek inbox (dan spam) untuk link konfirmasi, atau coba daftar ulang." }, 401)
        }
        return respond({ error: "Email atau password salah." }, 401)
      }

      auditLog("signin", normalizedEmail, ip, "success")
      return respond({ user: data.user, session: data.session })
    }

    // ───── Sign up ─────
    if (action === "signup") {
      const nama = ((body.nama as string) ?? "").trim()
      if (!nama || nama.length < 2 || nama.length > 100) return respond({ error: "Nama harus diisi (2-100 karakter)." }, 400)
      if (/[<>{}$]/.test(nama)) return respond({ error: "Nama mengandung karakter tidak valid." }, 400)

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail, password,
        options: { data: { nama } },
      })

      if (error) {
        auditLog("signup", normalizedEmail, ip, "failure", error.message)
        if (error.message.includes("already")) return respond({ error: "Email sudah terdaftar. Silakan login." }, 409)
        return respond({ error: "Gagal mendaftar. Coba lagi nanti." }, 500)
      }

      auditLog("signup", normalizedEmail, ip, "success")
      return respond({
        user: data.user,
        message: "📧 Email konfirmasi sudah dikirim! Cek inbox dan folder SPAM.",
        confirmationSent: true,
      })
    }

    return respond({ error: "Action tidak dikenal" }, 400)
  } catch (error) {
    console.error("Auth API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 })
  }
}
