"use client"

import { useState, useEffect } from "react"
import { User, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserProfile } from "@/types"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nama: "", npm: "", universitas: "", jurusan: "" })
  const [message, setMessage] = useState("")

  async function loadProfile() {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) {
        const profile = data as UserProfile
        setForm({
          nama: profile.nama ?? "",
          npm: profile.npm ?? "",
          universitas: profile.universitas ?? "",
          jurusan: profile.jurusan ?? "",
        })
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadProfile() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setMessage("Sesi tidak ditemukan. Silakan login ulang."); return }

      const { error } = await (supabase.from("profiles") as any).upsert({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: user.id,
        email: user.email ?? "",
        nama: form.nama,
        npm: form.npm,
        universitas: form.universitas,
        jurusan: form.jurusan,
      })

      if (error) { setMessage("Gagal menyimpan profil. Coba lagi."); return }
      setMessage("Profil berhasil disimpan! ✅")
    } catch {
      setMessage("Terjadi kesalahan")
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="size-7 text-primary" />
          Pengaturan Profil
        </h1>
        <p className="text-muted-foreground mt-1">Lengkapi data dirimu untuk pengalaman lebih baik.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Mahasiswa</CardTitle>
          <CardDescription>Data ini hanya digunakan di dalam aplikasi dan tidak dipublikasikan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npm">NPM / NIM</Label>
                <Input id="npm" value={form.npm} onChange={(e) => setForm({ ...form, npm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="universitas">Universitas</Label>
                <Input id="universitas" value={form.universitas} onChange={(e) => setForm({ ...form, universitas: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurusan">Jurusan</Label>
                <Input id="jurusan" value={form.jurusan} onChange={(e) => setForm({ ...form, jurusan: e.target.value })} />
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.includes("✅") ? "text-emerald-600" : "text-destructive"}`}>
                {message}
              </p>
            )}

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Simpan Profil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
