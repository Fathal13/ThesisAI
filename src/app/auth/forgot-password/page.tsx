"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const email = (form.get("email") as string)?.trim().toLowerCase() ?? ""

    if (!email) { setError("Email wajib diisi."); setLoading(false); return }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgot-password", email }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan")
        return
      }
      setSent(true)
    } catch {
      setError("Gagal terhubung ke server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Link href="/" className="container mx-auto px-4 py-6 flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
        <BookOpen className="size-6 text-primary" />
        <span>ThesisAI</span>
      </Link>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Lupa Password? 🔑</CardTitle>
            <CardDescription>
              Masukkan email kamu — kalau terdaftar, kami kirim link reset password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="size-12 text-emerald-500" />
                </div>
                <p className="text-muted-foreground">
                  📧 Kalau email terdaftar, link reset password sudah dikirim!
                  Cek inbox dan folder SPAM.
                </p>
                <p className="text-xs text-muted-foreground">
                  Link berlaku selama 1 jam dan hanya bisa dipakai sekali.
                </p>
                <Link href="/auth/login">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="size-4" /> Kembali ke Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle className="size-4" /> {error}
                  </p>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading} aria-busy={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Kirim Link Reset
                </Button>

                <p className="text-center">
                  <Link href="/auth/login" className="text-sm text-primary hover:underline">
                    ← Kembali ke login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
