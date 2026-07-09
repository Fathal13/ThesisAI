// ──────────────────────────────────────────
//  Simple in-memory rate limiter
//  Zero dependency — pas untuk free tier
//  Reset otomatis setiap window ms
// ──────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Bersihkan entry kadaluarsa tiap 5 menit (biar memory gak bocor)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 300_000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // ms
}

/**
 * Cek rate limit untuk sebuah key (IP / email / userID)
 *
 * @param key — identifier unik (misal: `ip:${req.headers.get("x-forwarded-for")}`)
 * @param maxRequests — maksimum request dalam window
 * @param windowMs — jendela waktu dalam milidetik (default: 60 detik)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    // Reset window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  entry.count++

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now }
}

/**
 * Rate limiter spesifik untuk login — lebih strict
 * Maks 5 percobaan per IP dalam 60 detik + 3 percobaan per email dalam 300 detik
 */
export function checkLoginRateLimit(
  ip: string,
  email: string,
): { allowed: boolean; reason?: string; retryAfter?: number } {
  // Global IP-based: 5 request/menit
  const ipCheck = checkRateLimit(`login:ip:${ip}`, 5, 60_000)
  if (!ipCheck.allowed) {
    return { allowed: false, reason: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.", retryAfter: Math.ceil(ipCheck.resetIn / 1000) }
  }

  // Email-based: 3 request/5 menit (cegah brute force akun spesifik)
  const emailCheck = checkRateLimit(`login:email:${email.toLowerCase()}`, 3, 300_000)
  if (!emailCheck.allowed) {
    return { allowed: false, reason: "Terlalu banyak percobaan untuk akun ini. Coba lagi dalam 5 menit.", retryAfter: Math.ceil(emailCheck.resetIn / 1000) }
  }

  return { allowed: true }
}

/**
 * Rate limiter untuk sign-up — cegah spam registrasi
 * Maks 2 akun per IP dalam 1 jam
 */
export function checkSignupRateLimit(ip: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const check = checkRateLimit(`signup:ip:${ip}`, 2, 3_600_000)
  if (!check.allowed) {
    return { allowed: false, reason: "Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.", retryAfter: Math.ceil(check.resetIn / 1000) }
  }
  return { allowed: true }
}
