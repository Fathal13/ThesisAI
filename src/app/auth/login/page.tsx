"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleAuth(e: React.FormEvent<HTMLFormElement>, action: "signin" | "signup") {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const form = new FormData(e.currentTarget)
    const body: Record<string, string> = {
      action,
      email: form.get("email") as string,
      password: form.get("password") as string,
    }
    if (action === "signup") body.nama = form.get("nama") as string

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan")
        return
      }

      if (action === "signin") {
        router.push("/dashboard")
        router.refresh()
      } else {
        setMessage("Cek email kamu untuk konfirmasi pendaftaran! 📧")
        setLoading(false) // keep loading false so form stays
      }
    } catch {
      setError("Gagal terhubung ke server")
    } finally {
      if (action === "signin") setLoading(false)
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
                    <Input id="email-login" name="email" type="email" placeholder="nama@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input id="password-login" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
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
                    <Input id="nama" name="nama" placeholder="Nama kamu" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">Email</Label>
                    <Input id="email-reg" name="email" type="email" placeholder="nama@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Password</Label>
                    <Input id="password-reg" name="password" type="password" placeholder="Min. 8 karakter" required minLength={8} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {message && <p className="text-sm text-emerald-600 font-medium">{message}</p>}
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    {loading ? "Mendaftarkan..." : "Daftar Gratis"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Dengan mendaftar, kamu setuju dengan{" "}
              <a href="#" className="underline">ketentuan layanan</a> kami.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
