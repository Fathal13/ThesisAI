"use client"

import { useState } from "react"
import { ChevronDown, Send, CheckCircle, AlertCircle, Loader2, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const FAQ_DATA = [
  {
    kategori: "AI & Parafrase",
    items: [
      {
        q: "Kenapa Parafrase Terpandu gagal/timeout?",
        a: "Fitur Parafrase Terpandu meminta AI menebak sinonim per kata (banyak request AI sekaligus). Kalau rate limit AI habis, request timeout. Tapi teks utama BAB sudah berhasil diparafrase — cek kolom hasil, biasanya sudah berisi teks baru. Tinggal approve perubahan."
      },
      {
        q: "Batasan karakter parafrase berapa?",
        a: "Maksimal 5000 karakter per request (~1000 kata). Potong per paragraf kalau teks panjang."
      },
      {
        q: "Gaya parafrase mana yang paling aman untuk skripsi?",
        a: "Gaya 'Akademik' paling direkomendasikan — vocabulary formal baku EYD V, cocok untuk penulisan ilmiah. 'Ubah Struktur' cocok kalau mau anti-plagiarisme tapi butuh review manual lebih teliti."
      },
    ]
  },
  {
    kategori: "Literatur Explorer",
    items: [
      {
        q: "Artikel dari CrossRef/OpenAlex tapi tidak ada PDF?",
        a: "Hanya artikel Open Access yang punya link PDF gratis. Kalau tidak ada, coba cari DOI di Google Scholar / Unpaywall, atau pinjam via perpustakaan kampus."
      },
      {
        q: "Ringkasan AI (summarize) gagal atau loading lama?",
        a: "Fitur summarize mengantre (rate limit AI gratis 60 req/menit). Tunggu sebentar, atau refresh halaman. Ringkuman tersimpan otomatis ke cache setelah sukses."
      },
      {
        q: "Bisa export ke RIS/BibTeX?",
        a: "Belum. Fitur export citation akan datang di update selanjutnya. Saat ini copy manual DOI/judul ke Zotero/Mendeley."
      },
    ]
  },
  {
    kategori: "Writing Assistant",
    items: [
      {
        q: "Review Writing beda dengan Parafrase apa?",
        a: "Review = koreksi (grammar, struktur, kejelasan) — AI HANYA memberi saran, TIDAK menulis ulang. Parafrase = menulis ulang teks dengan gaya berbeda."
      },
      {
        q: "Bisa review bab yang sudah selesai (status 'selesai')?",
        a: "Bisa. Status cuma label visual. Masuk ke halaman Writing, paste teks, klik Review."
      },
    ]
  },
  {
    kategori: "Sidang Prep",
    items: [
      {
        q: "Pertanyaan sidang AI itu akurat?",
        a: "AI generate berdasarkan konten bab + judul skripsi. Akurasi ~70-80% relevan. Masih butuh review manual & tambah pertanyaan spesifik dosen pembimbing."
      },
      {
        q: "Bisa simpan jawaban sendiri untuk latihan?",
        a: "Bisa. Di halaman Sidang, klik ikon edit pada pertanyaan → isi jawaban kamu → simpan. Bisa dibandingin dengan jawaban AI."
      },
    ]
  },
  {
    kategori: "Akun & Umum",
    items: [
      {
        q: "Ganti email / lupa password?",
        a: "Halaman Login → 'Lupa Password' → cek inbox & spam. Ganti email: belum tersedia di UI, hubungi admin via keluhan di tab sebelah."
      },
      {
        q: "Data saya aman tidak?",
        a: "Ya. Supabase RLS (Row Level Security) — kamu hanya akses data sendiri. Tidak ada tracking, tidak dijual. Lihat halaman Kebijakan Privasi di footer."
      },
      {
        q: "ThesisAI benar-benar gratis selamanya?",
        a: "Ya. Running on Vercel Hobby + Supabase Free + Gemini API Free. Tidak ada plan berbayar. Jika limit AI tercapai, tunggu reset (biasanya 1 menit)."
      },
    ]
  },
]

export default function BantuanPage() {
  const [activeTab, setActiveTab] = useState("keluhan")
  const [kategori, setKategori] = useState("")
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kategori || !judul.trim() || !deskripsi.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori, judul: judul.trim(), deskripsi: deskripsi.trim() }),
      })
      if (res.ok) {
        setStatus("success")
        setKategori("")
        setJudul("")
        setDeskripsi("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const KATEGORI_OPTIONS = [
    { value: "bug", label: "🐛 Bug / Error" },
    { value: "fitur", label: "✨ Request Fitur" },
    { value: "ai", label: "🤖 Masalah AI" },
    { value: "lainnya", label: "📝 Lainnya" },
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bantuan & Keluhan</h1>
        <p className="text-muted-foreground mt-1">Butuh bantuan? Cek FAQ atau ajukan keluhan ke tim kami.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="keluhan">📝 Ajukan Keluhan</TabsTrigger>
          <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
        </TabsList>

        {/* ─── KELOHAN ─── */}
        <TabsContent value="keluhan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kirim Keluhan / Saran</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={kategori} onValueChange={(v: string | null) => v && setKategori(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judul">Judul</Label>
                  <Input id="judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkas, misal: Parafrase timeout saat generate sinonim" maxLength={200} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi Lengkap</Label>
                  <Textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={6} placeholder="Jelaskan detail: langkah yang sudah dicoba, error message, screenshot (bisa paste di sini), dsb." />
                </div>

                <Button type="submit" disabled={status === "loading"} className="gap-2">
                  {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {status === "loading" ? "Mengirim..." : status === "success" ? "Terkirim ✓" : "Kirim Keluhan"}
                </Button>

                {status === "success" && (
                  <p className="text-sm text-emerald-600 flex items-center gap-2">
                    <CheckCircle className="size-4" /> Keluhan terkirim! Tim kami akan balas via email (jika butuh).
                  </p>
                )}
                {status === "error" && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" /> Gagal kirim. Coba lagi nanti.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── FAQ ─── */}
        <TabsContent value="faq" className="mt-6">
          <div className="space-y-4">
            {FAQ_DATA.map((cat) => (
              <Card key={cat.kategori} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HelpCircle className="size-4 text-muted-foreground" />
                    {cat.kategori}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {cat.items.map((item, idx) => (
                      <details key={idx} className="group border rounded-lg overflow-hidden">
                        <summary className="flex items-center justify-between p-4 cursor-pointer list-none bg-card hover:bg-muted/50 transition-colors">
                          <span className="font-medium text-sm pr-4">{item.q}</span>
                          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0" />
                        </summary>
                        <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}