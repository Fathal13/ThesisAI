"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Access token & refresh token dari URL hash (Supabase redirect setelah klik email)
  // searchParams tidak baca hash, perlu pakai window.location.hash
  useEffect(() => {
    // Ambil token dari URL hash (format: #access_token=xxx&refresh_token=yyy&type=recovery)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get("access_token")
    const type = params.get("type")

    if (accessToken && type === "recovery") {
      // Store tokens for password reset
      sessionStorage.setItem("sb_reset_access_token", accessToken)
      // Bersihkan URL hash
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  function validatePassword(pw: string): string | null {
    if (!pw) return "Password wajib diisi."
    if (pw.length < 8) return "Password minimal 8 karakter."
    if (pw.length > 128) return "Password terlalu panjang (max 128)."
    if (!/[A-Z]/.test(pw)) return "Harus mengandung minimal 1 huruf kapital."
    if (!/[a-z]/.test(pw)) return "Harus mengandung minimal 1 huruf kecil."
    if (!/[0-9]/.test(pw)) return "Harus mengandung minimal 1 angka."
    if (!/[^A-Za-z0-9]/.test(pw)) return "Harus mengandung minimal 1 simbol."
    return null
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")

    const passError = validatePassword(password)
    if (passError) { setError(passError); return }
    if (password !== confirmPassword) { setError("Konfirmasi password tidak cocok."); return }

    const accessToken = sessionStorage.getItem("sb_reset_access_token")
    if (!accessToken) {
      setError("Token reset tidak ditemukan atau sudah kadaluarsa. Coba minta ulang email reset.")
      return
    }

    setLoading(true)
    try {
      // Pakai Supabase JS client dengan custom access token
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        }
      )

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Bersihkan token
      sessionStorage.removeItem("sb_reset_access_token")
      sessionStorage.removeItem("sb_reset_refresh_token")

      setMessage("✅ Password berhasil diperbarui! Silakan login dengan password baru.")
      setTimeout(() => router.push("/auth/login?reset=success"), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui password"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Link href="/" className="container mx-auto px-4 py-6 flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
        <Lock className="size-6 text-primary" />
        <span>ThesisAI</span>
      </Link>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Atur Ulang Password 🔐</CardTitle>
            <CardDescription>
              Masukkan password baru yang aman. Minimal 8 karakter dengan huruf besar, kecil, angka & simbol.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min 8 char: Aa1!@#"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                  <AlertCircle className="size-4" /> {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="size-4" /> {message}
                </p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loading} aria-busy={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {loading ? "Memperbarui..." : "Perbarui Password"}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Ingat password?{" "}
              <Link href="/auth/login" className="underline hover:text-primary">
                Kembali ke Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}