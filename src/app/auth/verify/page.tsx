"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Mail, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const redirect = searchParams.get("redirect") ?? "/dashboard"

  // Cek apakah user sudah confirm email
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "check-session" }),
        })
        const data = await res.json()
        if (res.ok && data.user?.email_confirmed_at) {
          router.push(redirect)
          router.refresh()
        }
      } catch {
        // ignore
      }
    }
    checkSession()
  }, [redirect, router])

  async function handleResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setMessage("")
    setResendLoading(true)

    const form = new FormData(e.currentTarget)
    const email = (form.get("email") as string)?.trim().toLowerCase() ?? ""

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid.")
      setResendLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend-confirmation", email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim ulang email. Coba lagi nanti.")
      } else {
        setMessage(data.message ?? "✅ Email konfirmasi sudah dikirim ulang! Cek inbox & SPAM.")
      }
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi internet.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <Link href="/" className="container mx-auto px-4 py-6 flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
        <span className="text-primary">ThesisAI</span>
      </Link>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="size-10 text-primary mx-auto mb-3" />
            <CardTitle className="text-2xl">Verifikasi Email</CardTitle>
            <CardDescription>
              Kami sudah mengirim email konfirmasi ke inbox kamu.
              Cek email (termasuk folder SPAM) dan klik link di dalamnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Link konfirmasi berlaku <strong>24 jam</strong>.
              </p>

              {message && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle className="size-4 flex-shrink-0" />
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2" role="alert">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Resend form */}
            <form onSubmit={handleResend} className="space-y-3 border-t pt-6">
              <p className="text-xs text-muted-foreground text-center">
                Belum menerima email? Atau link sudah kadaluarsa?
              </p>
              <div className="space-y-2">
                <Label htmlFor="email-resend" className="text-sm font-medium">
                  Email terdaftar
                </Label>
                <Input
                  id="email-resend"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  required
                  disabled={resendLoading}
                  className="h-10"
                />
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={resendLoading}
                  aria-busy={resendLoading}
                >
                  {resendLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {resendLoading ? "Mengirim..." : "Kirim Ulang Email Konfirmasi"}
                </Button>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>Sudah verifikasi tapi belum bisa masuk?</p>
              <Link href={`/auth/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline font-medium">
                Coba login lagi
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}