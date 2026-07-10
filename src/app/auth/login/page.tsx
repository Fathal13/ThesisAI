"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Loader2, Mail, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Client-side validation helpers
  function validateEmail(email: string): string | null {
    if (!email) return "Email wajib diisi."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid."
    if (email.length > 254) return "Email terlalu panjang."
    return null
  }

  function validatePassword(password: string, isSignup: boolean): string | null {
    if (!password) return "Password wajib diisi."
    if (isSignup) {
      if (password.length < 8) return "Password minimal 8 karakter."
      if (password.length > 128) return "Password terlalu panjang (max 128)."
      if (!/[A-Z]/.test(password)) return "Password harus mengandung minimal 1 huruf besar."
      if (!/[a-z]/.test(password)) return "Password harus mengandung minimal 1 huruf kecil."
      if (!/[0-9]/.test(password)) return "Password harus mengandung minimal 1 angka."
      if (!/[^A-Za-z0-9]/.test(password)) return "Password harus mengandung minimal 1 simbol."
    }
    return null
  }

  function validateName(name: string): string | null {
    if (!name) return "Nama wajib diisi."
    if (name.length < 2) return "Nama minimal 2 karakter."
    if (name.length > 100) return "Nama terlalu panjang (max 100)."
    if (/[<>{}$]/.test(name)) return "Nama mengandung karakter tidak valid."
    return null
  }

  async function handleAuth(e: React.FormEvent<HTMLFormElement>, action: "signin" | "signup") {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const form = new FormData(e.currentTarget)
    const email = (form.get("email") as string)?.trim().toLowerCase() ?? ""
    const password = form.get("password") as string
    const nama = (form.get("nama") as string)?.trim() ?? ""

    // Client-side validation
    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); setLoading(false); return }

    const passError = validatePassword(password, action === "signup")
    if (passError) { setError(passError); setLoading(false); return }

    if (action === "signup") {
      const nameError = validateName(nama)
      if (nameError) { setError(nameError); setLoading(false); return }
    }

    const body: Record<string, string> = { action, email, password }
    if (action === "signup") body.nama = nama

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan")
        return
      }

      if (action === "signin" || (action === "signup" && data.session)) {
        router.push(searchParams.get("redirect") ?? "/dashboard")
        router.refresh()
      } else if (action === "signup") {
        setMessage(data.message ?? "Cek email kamu untuk konfirmasi pendaftaran! 📧")
      } else if (action === "resend-confirmation") {
        setMessage(data.message ?? "✅ Email konfirmasi sudah dikirim!")
      }
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi internet.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center gap-2 font-bold text-xl">
        <BookOpen className="size-6 text-primary" />
        <span>ThesisAI</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Selamat Datang di ThesisAI 👋</CardTitle>
            <CardDescription>
              Gratis untuk mahasiswa Indonesia. Skripsi selesai tepat waktu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">Masuk</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Daftar</TabsTrigger>
              </TabsList>

              {/* ─── LOGIN ─── */}
              <TabsContent value="login">
                <form onSubmit={(e) => handleAuth(e, "signin")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input
                      id="email-login"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input
                      id="password-login"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                        <AlertCircle className="size-4" /> {error}
                      </p>
                      {/* Tampilkan tombol kirim ulang jika error karena not confirmed */}
                      {(error.includes("belum dikonfirmasi") || error.includes("SPAM")) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1"
                          disabled={loading}
                          onClick={async () => {
                            const email = (document.getElementById("email-login") as HTMLInputElement)?.value
                            if (!email) return
                            setError("")
                            setLoading(true)
                            try {
                              const res = await fetch("/api/auth", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "resend-confirmation", email }),
                              })
                              const data = await res.json()
                              if (res.ok) setMessage(data.message)
                              else setError(data.error)
                            } catch {
                              setError("Gagal kirim ulang. Coba lagi.")
                            } finally { setLoading(false) }
                          }}
                        >
                          <Mail className="size-3.5" />
                          Kirim Ulang Email Konfirmasi
                        </Button>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full gap-2" disabled={loading} aria-busy={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    Masuk
                  </Button>
                </form>
              </TabsContent>

              {/* ─── REGISTER ─── */}
              <TabsContent value="register">
                <form onSubmit={(e) => handleAuth(e, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      name="nama"
                      autoComplete="name"
                      placeholder="Nama kamu"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input
                      id="email-reg"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Password</Label>
                    <Input
                      id="password-reg"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Min 8 char: Aa1!@#"
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimal 8 karakter — harus ada huruf besar, kecil, angka & simbol
                    </p>
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
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    {loading ? "Mendaftarkan..." : "Daftar Gratis"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Dengan mendaftar, kamu setuju dengan{" "}
              <a href="/syarat-ketentuan" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                syarat & ketentuan
              </a>{" "}
              dan{" "}
              <a href="/kebijakan-privasi" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">
                kebijakan privasi
              </a>{" "}
              kami.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
