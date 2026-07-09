import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkLoginRateLimit, checkSignupRateLimit } from "@/lib/rate-limit"

const CSRF_TOKEN_NAME = "csrf_token"

// ──────────────────────────────────────────
//  Helper: get IP dari request
// ──────────────────────────────────────────

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

// ──────────────────────────────────────────
//  Helper: validasi password strength
// ──────────────────────────────────────────

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password minimal 8 karakter."
  }
  if (password.length > 128) {
    return "Password maksimal 128 karakter."
  }
  if (!/[A-Z]/.test(password)) {
    return "Password harus mengandung minimal 1 huruf kapital."
  }
  if (!/[a-z]/.test(password)) {
    return "Password harus mengandung minimal 1 huruf kecil."
  }
  if (!/[0-9]/.test(password)) {
    return "Password harus mengandung minimal 1 angka."
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password harus mengandung minimal 1 karakter spesial (misal: !@#$%^&*)."
  }
  return null // valid
}

// ──────────────────────────────────────────
//  Helper: validasi email format
// ──────────────────────────────────────────

function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || email.length > 254) {
    return "Email tidak valid."
  }
  if (!emailRegex.test(email)) {
    return "Format email tidak valid."
  }
  // Cegah email dengan karakter mencurigakan
  if (/['"<>(){}]/.test(email)) {
    return "Email mengandung karakter tidak valid."
  }
  return null
}

// ──────────────────────────────────────────
//  Helper: audit log
// ──────────────────────────────────────────

function auditLog(action: string, email: string, ip: string, status: "success" | "failure", detail?: string) {
  // Di Vercel log — nantinya bisa di-upgrade ke Supabase Audit table
  console.log(
    JSON.stringify({
      level: "audit",
      timestamp: new Date().toISOString(),
      action,
      email: email.toLowerCase(),
      ip,
      status,
      detail,
    }),
  )
}

// ──────────────────────────────────────────
//  POST /api/auth
// ──────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    // --- Validate Content-Type ---
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

    // --- CSRF protection (skip for signout) ---
    if (action === "signin" || action === "signup") {
      const cookieStore = await cookies()
      const csrfCookie = cookieStore.get(CSRF_TOKEN_NAME)?.value
      const csrfHeader = request.headers.get("x-csrf-token")

      if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
        console.warn(`[CSRF] Token mismatch from IP ${ip}`)
        return NextResponse.json({ error: "Request tidak valid." }, { status: 403 })
      }
    }

    const email = ((body.email as string) ?? "").trim()
    const password = (body.password as string) ?? ""

    // --- Validate required fields ---
    if (!action || !["signin", "signup", "signout"].includes(action)) {
      return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
    }

    // --- Sign-out (no validation needed) ---
    if (action === "signout") {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set() {},
            remove() {},
          },
        },
      )
      await supabase.auth.signOut()
      return NextResponse.json({ success: true })
    }

    // --- Email & password validation ---
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password harus diisi." }, { status: 400 })
    }

    const emailError = validateEmail(email)
    if (emailError) {
      auditLog(action, email, ip, "failure", emailError)
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError && action === "signup") {
      auditLog(action, email, ip, "failure", passwordError)
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    // --- Rate limiting ---
    if (action === "signin") {
      const limitCheck = checkLoginRateLimit(ip, email)
      if (!limitCheck.allowed) {
        auditLog("signin", email, ip, "failure", `Rate limited: ${limitCheck.reason}`)
        return NextResponse.json(
          { error: limitCheck.reason, retryAfter: limitCheck.retryAfter },
          { status: 429 },
        )
      }
    }

    if (action === "signup") {
      const limitCheck = checkSignupRateLimit(ip)
      if (!limitCheck.allowed) {
        auditLog("signup", email, ip, "failure", `Rate limited: ${limitCheck.reason}`)
        return NextResponse.json(
          { error: limitCheck.reason },
          { status: 429 },
        )
      }
    }

    // --- Normalize email (lowercase — cegah duplicate case-sensitive) ---
    const normalizedEmail = email.toLowerCase()

    // --- Init Supabase client ---
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            })
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            })
          },
        },
      },
    )

    // --- Sign-in ---
    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        auditLog("signin", normalizedEmail, ip, "failure", error.message)
        // Jangan bocorkan apakah email terdaftar atau tidak
        return NextResponse.json(
          { error: "Email atau password salah." },
          { status: 401 },
        )
      }

      auditLog("signin", normalizedEmail, ip, "success")
      return NextResponse.json({ user: data.user, session: data.session })
    }

    // --- Sign-up ---
    if (action === "signup") {
      const nama = ((body.nama as string) ?? "").trim()

      if (!nama || nama.length < 2 || nama.length > 100) {
        return NextResponse.json({ error: "Nama harus diisi (2-100 karakter)." }, { status: 400 })
      }

      // Cegah nama dengan karakter mencurigakan
      if (/[<>{}$]/.test(nama)) {
        return NextResponse.json({ error: "Nama mengandung karakter tidak valid." }, { status: 400 })
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { nama },
        },
      })

      if (error) {
        auditLog("signup", normalizedEmail, ip, "failure", error.message)
        // Jangan bocorkan detail error ke user (misal: "user already exists")
        if (error.message.includes("already")) {
          return NextResponse.json(
            { error: "Email sudah terdaftar. Silakan login." },
            { status: 409 },
          )
        }
        return NextResponse.json({ error: "Gagal mendaftar. Coba lagi nanti." }, { status: 500 })
      }

      auditLog("signup", normalizedEmail, ip, "success")
      return NextResponse.json({
        user: data.user,
        message: "Cek email untuk konfirmasi pendaftaran. 📧",
      })
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 })
  } catch (error) {
    console.error("Auth API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 })
  }
}
