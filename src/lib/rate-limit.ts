import { getSupabaseAdmin } from "@/lib/supabase-admin"

interface RateLimitEntry {
  count: number
  resetAt: number // ms since epoch
}

/**
 * Rate limiter berbasis Supabase (persistent, works across Vercel instances)
 * Table: public.rate_limit (key PRIMARY KEY, count INTEGER, reset_at TIMESTAMPTZ)
 *
 * Works with service role key (server-side only)
 */
async function getRateLimitEntry(key: string): Promise<RateLimitEntry | null> {
  const supabaseAdmin = await getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from("rate_limit")
    .select("count, reset_at")
    .eq("key", key)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("[rate-limit] Get error:", error.message)
    return null
  }
  if (!data) return null

  const row = data as unknown as { count: number; reset_at: string }
  return {
    count: row.count,
    resetAt: new Date(row.reset_at).getTime(),
  }
}

async function setRateLimitEntry(key: string, count: number, resetAt: number): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin()
  const { error } = await supabaseAdmin.from("rate_limit").upsert({
    key,
    count,
    reset_at: new Date(resetAt).toISOString(),
  } as never)

  if (error) {
    console.error("[rate-limit] Set error:", error.message)
  }
}

/**
 * Cek rate limit untuk sebuah key (IP / email / userID)
 * Menggunakan Supabase sebagai persistent store
 *
 * @param key — identifier unik (misal: `ip:${req.headers.get("x-forwarded-for")}`)
 * @param maxRequests — maksimum request dalam window
 * @param windowMs — jendela waktu dalam milidetik (default: 60 detik)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now()
  const entry = await getRateLimitEntry(key)

  if (!entry || entry.resetAt <= now) {
    // Reset window
    await setRateLimitEntry(key, 1, now + windowMs)
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  const newCount = entry.count + 1

  if (newCount > maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  await setRateLimitEntry(key, newCount, entry.resetAt)
  return { allowed: true, remaining: maxRequests - newCount, resetIn: entry.resetAt - now }
}

/**
 * Rate limiter spesifik untuk login — lebih strict
 * Maks 5 percobaan per IP dalam 60 detik + 3 percobaan per email dalam 300 detik
 */
export async function checkLoginRateLimit(
  ip: string,
  email: string,
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  // Global IP-based: 5 request/menit
  const ipCheck = await checkRateLimit(`login:ip:${ip}`, 5, 60_000)
  if (!ipCheck.allowed) {
    return { allowed: false, reason: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.", retryAfter: Math.ceil(ipCheck.resetIn / 1000) }
  }

  // Email-based: 3 request/5 menit (cegah brute force akun spesifik)
  const emailCheck = await checkRateLimit(`login:email:${email.toLowerCase()}`, 3, 300_000)
  if (!emailCheck.allowed) {
    return { allowed: false, reason: "Terlalu banyak percobaan untuk akun ini. Coba lagi dalam 5 menit.", retryAfter: Math.ceil(emailCheck.resetIn / 1000) }
  }

  return { allowed: true }
}

/**
 * Rate limiter untuk sign-up — cegah spam registrasi
 * Maks 2 akun per IP dalam 1 jam
 */
export async function checkSignupRateLimit(ip: string): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const check = await checkRateLimit(`signup:ip:${ip}`, 2, 3_600_000)
  if (!check.allowed) {
    return { allowed: false, reason: "Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.", retryAfter: Math.ceil(check.resetIn / 1000) }
  }
  return { allowed: true }
}
