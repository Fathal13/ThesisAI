"use client"

import { useState, useEffect, useRef } from "react"
import type { Bab as BabType } from "@/types"
import { Edit3, Loader2, Sparkles, Trash2, FileText, AlertCircle, Check, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { WritingDisclaimer } from "@/components/disclaimer"

interface Bab {
  id: string
  judul: string
  nomor_bab: number
  konten: string
  status: "draft" | "review" | "revisi" | "selesai"
  target_selesai: string | null
  created_at: string
  updated_at?: string
}

interface WritingReview {
  grammar: string[]
  wordChoice: string[]
  structure: string[]
  clarity: string[]
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  review: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  revisi: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  selesai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Siap Review",
  revisi: "Revisi",
  selesai: "Selesai",
}

const BAB_OPTIONS = [
  { value: "1", label: "Bab 1 — Pendahuluan" },
  { value: "2", label: "Bab 2 — Tinjauan Pustaka" },
  { value: "3", label: "Bab 3 — Metodologi" },
  { value: "4", label: "Bab 4 — Hasil & Pembahasan" },
  { value: "5", label: "Bab 5 — Kesimpulan" },
]

export default function WritingPage() {
  const [babList, setBabList] = useState<Bab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [review, setReview] = useState<WritingReview | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showReview, setShowReview] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  // ─── Paraphrase state ───
  const [paraphraseLoading, setParaphraseLoading] = useState(false)
  const [showParaphraseModal, setShowParaphraseModal] = useState(false)
  const [paraphraseStyle, setParaphraseStyle] = useState<"akademik" | "lebih-formal" | "ubah-struktur">("akademik")
  const [paraphraseResult, setParaphraseResult] = useState<string | null>(null)
  const [paraphraseOriginal, setParaphraseOriginal] = useState("")

  const [form, setForm] = useState({
    judul: "",
    nomor_bab: "1",
    konten: "",
    target_selesai: "",
    status: "draft" as Bab["status"],
  })

  // Auto-open bab from URL param (useEffect on mount + callback ke setBabList)
  // Ref to store target bab id so we can reference it inside setState callback
  const openBabRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const babId = params.get("bab")
    if (babId) {
      openBabRef.current = babId
    }
  }, [])

  const fetchBab = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data, error: err } = await supabase
        .from("bab")
        .select("*")
        .order("nomor_bab", { ascending: true })

      if (!err && data) {
        // Check if we need to auto-open a specific bab
        const targetId = openBabRef.current
        if (targetId) {
          const babArr = data as BabType[]
          const targetBab = babArr.find((b) => b.id === targetId)
          if (targetBab) {
            // Set editing state directly from fetched data
            setEditingId(targetBab.id)
            setForm({
              judul: targetBab.judul,
              nomor_bab: String(targetBab.nomor_bab),
              konten: targetBab.konten,
              target_selesai: targetBab.target_selesai ?? "",
              status: targetBab.status,
            })
            setReview(null)
            openBabRef.current = null
            // Clean up URL
            window.history.replaceState({}, "", "/dashboard/writing")
          }
        }
        setBabList(data)
      }
    } catch {
      // Not logged in
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBab() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setReview(null)

    const { supabase } = await import("@/lib/supabase")
    const payload = {
      judul: form.judul || BAB_OPTIONS.find((b) => b.value === form.nomor_bab)?.label || "",
      nomor_bab: parseInt(form.nomor_bab),
      konten: form.konten,
      status: form.status,
      target_selesai: form.target_selesai || null,
    }

    if (editingId) {
      const { error: err } = await (supabase.from("bab") as any).update(payload).eq("id", editingId) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err) { setError(err.message); return }
    } else {
      const { error: err } = await (supabase.from("bab") as any).insert(payload) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err) { setError(err.message); return }
    }

    resetForm()
    fetchBab()
  }

  function editBab(bab: Bab) {
    setEditingId(bab.id)
    setForm({
      judul: bab.judul,
      nomor_bab: String(bab.nomor_bab),
      konten: bab.konten,
      target_selesai: formatDateInput(bab.target_selesai),
      status: bab.status,
    })
    setReview(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus bab ini?")) return
    const { supabase } = await import("@/lib/supabase")
    await (supabase.from("bab") as any).delete().eq("id", id) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (editingId === id) resetForm()
    fetchBab()
  }

  function resetForm() {
    setEditingId(null)
    setForm({ judul: "", nomor_bab: "1", konten: "", target_selesai: "", status: "draft" })
    setReview(null)
  }

  async function handleReview(bab: Bab) {
    setReviewLoading(true)
    setReview(null)
    setShowReview(bab.id)

    try {
      const res = await fetch("/api/writing/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judulBab: bab.judul, konten: bab.konten }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Gagal review")
        return
      }

      setReview(data)
      // Update status ke "review"
      const { supabase } = await import("@/lib/supabase")
      await (supabase.from("bab") as any).update({ status: "review" }).eq("id", bab.id) // eslint-disable-line @typescript-eslint/no-explicit-any

      // Recalculate progress
      try { await fetch("/api/progress/recalculate", { method: "POST" }) } catch { /* skip */ }

      fetchBab()
    } catch {
      setError("Gagal review tulisan. Coba lagi.")
    } finally {
      setReviewLoading(false)
    }
  }

  // ─── Paraphrase handler ───
  async function handleParaphrase() {
    if (!form.konten.trim()) return
    setParaphraseLoading(true)
    setParaphraseOriginal(form.konten)
    setParaphraseResult(null)

    try {
      const res = await fetch("/api/ai/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: form.konten, style: paraphraseStyle }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Gagal memparafrase")
        return
      }

      setParaphraseResult(data.result)
      setShowParaphraseModal(true)
    } catch {
      setError("Gagal memparafrase. Coba lagi.")
    } finally {
      setParaphraseLoading(false)
    }
  }

  function applyParaphrase() {
    if (paraphraseResult) {
      setForm((prev) => ({ ...prev, konten: paraphraseResult }))
      setParaphraseResult(null)
      setParaphraseOriginal("")
      setShowParaphraseModal(false)
    }
  }

  function closeParaphraseModal() {
    setShowParaphraseModal(false)
    setParaphraseResult(null)
    setParaphraseOriginal("")
  }

  async function updateStatus(id: string, status: Bab["status"]) {
    const { supabase } = await import("@/lib/supabase")
    await (supabase.from("bab") as any).update({ status }).eq("id", id) // eslint-disable-line @typescript-eslint/no-explicit-any

    // Auto-update progress saat status berubah
    try {
      await fetch("/api/progress/recalculate", { method: "POST" })
    } catch {
      // Silently fail — progress tidak kritis
    }

    fetchBab()
  }

  const formNomorBab = form.nomor_bab

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Edit3 className="size-7 text-primary" />
          Writing Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Tulis & review bab skripsi dengan bantuan AI. Fokus: saran, bukan menuliskan untukmu.
        </p>
      </div>

      <WritingDisclaimer />

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? "Edit Bab" : "Tambah Bab Baru"}</CardTitle>
          <CardDescription>
            {editingId ? "Update konten bab yang sudah ada" : "Tambahkan bab skripsi kamu disini"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <Label htmlFor="nomor_bab" className="group-hover:text-primary transition-colors cursor-pointer">
                  Nomor Bab
                </Label>
                <Select
                  value={formNomorBab}
                  onValueChange={(v) => { if (v) setForm({ ...form, nomor_bab: v }) }}
                >
                  <SelectTrigger id="nomor_bab" className="group-hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Pilih bab" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto">
                    {BAB_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="target_selesai" className="group-hover:text-primary transition-colors cursor-pointer">
                  Target Selesai (opsional)
                </Label>
                <Input
                  id="target_selesai"
                  type="date"
                  value={form.target_selesai}
                  onChange={(e) => setForm({ ...form, target_selesai: e.target.value })}
                  className="group-hover:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="judul" className="group-hover:text-primary transition-colors cursor-pointer">
                Judul Bab (biarkan kosong untuk pakai default)
              </Label>
              <Input
                id="judul"
                placeholder={BAB_OPTIONS.find((b) => b.value === form.nomor_bab)?.label ?? ""}
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="group-hover:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="file_upload" className="group-hover:text-primary transition-colors cursor-pointer">Upload File (.docx / .txt) — Opsional</Label>
              <Input
                id="file_upload"
                type="file"
                accept=".docx,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadLoading(true)
                  try {
                    const formData = new FormData()
                    formData.append("file", file)
                    const res = await fetch("/api/writing/upload", {
                      method: "POST",
                      body: formData,
                    })
                    const data = await res.json()
                    if (!res.ok) {
                      setError(data.error ?? "Gagal mengupload file")
                      return
                    }
                    setForm((prev) => ({ ...prev, konten: data.text }))
                  } catch {
                    setError("Gagal memproses file. Coba copy-paste manual.")
                  } finally {
                    setUploadLoading(false)
                    // Reset file input
                    e.target.value = ""
                  }
                }}
                disabled={uploadLoading}
                className="group-hover:border-primary/50 transition-colors"
              />
              {uploadLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Memproses file...
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Mendukung .docx (pakai mammoth) dan .txt. Maks 5MB.
              </p>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="konten" className="group-hover:text-primary transition-colors cursor-pointer">Isi Bab</Label>
              <Textarea
                id="konten"
                placeholder="Tulis atau paste isi bab skripsimu di sini..."
                value={form.konten}
                onChange={(e) => setForm({ ...form, konten: e.target.value })}
                rows={12}
                className="min-h-[200px] group-hover:border-primary/50 transition-colors"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit">
                {editingId ? "Update Bab" : "Simpan Bab"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleParaphrase}
                disabled={!form.konten.trim() || paraphraseLoading}
                className="gap-2"
              >
                {paraphraseLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Parafrase
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParaphraseStyle("akademik")}
                  className={cn("text-xs gap-1", paraphraseStyle === "akademik" && "ring-2 ring-primary")}
                  title="Gaya akademik formal"
                  disabled={paraphraseLoading}
                >
                  ✍️ Akademik
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParaphraseStyle("lebih-formal")}
                  className={cn("text-xs gap-1", paraphraseStyle === "lebih-formal" && "ring-2 ring-primary")}
                  title="Lebih formal dan baku"
                  disabled={paraphraseLoading}
                >
                  📝 Formal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParaphraseStyle("ubah-struktur")}
                  className={cn("text-xs gap-1", paraphraseStyle === "ubah-struktur" && "ring-2 ring-primary")}
                  title="Ubah struktur kalimat"
                  disabled={paraphraseLoading}
                >
                  🔄 Struktur
                </Button>
              </div>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Daftar Bab */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Daftar Bab</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : babList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="size-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada bab. Mulai tambah bab pertama kamu!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {babList.map((bab) => (
              <Card key={bab.id} className={cn(editingId === bab.id && "ring-2 ring-primary")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{bab.judul}</CardTitle>
                      <CardDescription>
                        Terakhir diubah: {new Date(bab.updated_at ?? bab.created_at).toLocaleDateString("id-ID")}
                        {bab.target_selesai && ` · Target: ${new Date(bab.target_selesai).toLocaleDateString("id-ID")}`}
                      </CardDescription>
                    </div>
                    <Badge className={cn("text-xs", STATUS_COLORS[bab.status])}>
                      {STATUS_LABELS[bab.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                    {bab.konten.slice(0, 200)}{bab.konten.length > 200 ? "..." : ""}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => editBab(bab)}>
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(bab)}
                      disabled={reviewLoading && showReview === bab.id}
                      className="gap-1.5"
                    >
                      {reviewLoading && showReview === bab.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Review AI
                    </Button>

                    <Select
                      value={bab.status}
                      onValueChange={(v) => updateStatus(bab.id, v as Bab["status"])}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Siap Review</SelectItem>
                        <SelectItem value="revisi">Revisi</SelectItem>
                        <SelectItem value="selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bab.id)}
                      className="text-destructive hover:text-destructive ml-auto"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {/* Review Results */}
                  {showReview === bab.id && review && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4 text-sm">
                        <ReviewSection
                          title="📝 Tata Bahasa"
                          items={review.grammar}
                          icon={<AlertCircle className="size-4 text-red-500" />}
                        />
                        <ReviewSection
                          title="🔤 Pilihan Kata"
                          items={review.wordChoice}
                          icon={<Edit3 className="size-4 text-blue-500" />}
                        />
                        <ReviewSection
                          title="📐 Struktur"
                          items={review.structure}
                          icon={<AlertCircle className="size-4 text-amber-500" />}
                        />
                        <ReviewSection
                          title="💡 Kejelasan"
                          items={review.clarity}
                          icon={<AlertCircle className="size-4 text-purple-500" />}
                        />
                      </div>
                    </>
                  )}

                  {showReview === bab.id && reviewLoading && (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      AI sedang menganalisis tulisanmu...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── Paraphrase Modal ─── */}
      {showParaphraseModal && paraphraseResult && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 bg-black/50">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Hasil Parafrase
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({paraphraseStyle === "akademik" ? "Akademik" : paraphraseStyle === "lebih-formal" ? "Formal" : "Ubah Struktur"})
                </span>
              </h3>
              <Button variant="ghost" size="icon" onClick={closeParaphraseModal}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Body: diff view */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Teks yang <span className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">disorot kuning</span> adalah kata yang berubah. Periksa sebelum menerapkan.
              </p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                <HighlightDiff original={paraphraseOriginal} result={paraphraseResult} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <Button variant="outline" onClick={closeParaphraseModal}>
                Batal
              </Button>
              <Button onClick={applyParaphrase} className="gap-2">
                <Check className="size-4" />
                Terapkan Hasil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Konversi target_selesai dari Supabase (string/Date/null) ke format YYYY-MM-DD
 * untuk input type="date". Input type="date" cuma nerima format YYYY-MM-DD.
 */
function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return ""
  if (typeof date === "string") {
    // Kalau udah YYYY-MM-DD, return langsung
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    // Kalau string ISO: parse dulu
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().split("T")[0]
  }
  // Date object
  if (isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

function ReviewSection({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items || items.length === 0) return null

  return (
    <div>
      <p className="font-medium flex items-center gap-2 mb-2">{icon} {title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Komponen diff: bandingkan teks original dengan hasil parafrase,
 * lalu sorot kata-kata yang berubah dengan background kuning.
 *
 * Cara kerja:
 * 1. Tokenisasi kedua teks per kata
 * 2. Iterasi original: jika kata berubah → sorot di hasil
 * 3. Kata baru yang tidak ada di original → juga disorot
 */
function HighlightDiff({ original, result }: { original: string; result: string }) {
  const originalWords = original.split(/(\s+)/)
  const resultWords = result.split(/(\s+)/)

  // Buat set kata dari original untuk deteksi kata baru
  const originalTokens = new Set(
    original.split(/\s+/).map((w) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()).filter(Boolean),
  )

  return (
    <div className="space-y-1">
      {resultWords.map((word, i) => {
        const clean = word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
        if (!clean || /^\s+$/.test(word)) {
          // Whitespace — render apa adanya
          return <span key={i}>{word}</span>
        }

        // Cek apakah kata ini ada di original
        const isChanged = !originalTokens.has(clean)

        // Edge case: angka, kutipan, atau kata pendek (< 3 char) jangan disorot
        const shouldHighlight = isChanged && clean.length >= 3 && !/^\d+$/.test(clean)

        if (shouldHighlight) {
          return (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5" title={`Berubah dari "${findOriginal(original, clean)}"`}>
              {word}
            </span>
          )
        }
        return <span key={i}>{word}</span>
      })}
    </div>
  )
}

/** Cari kata orisinal yang mirip (untuk tooltip) */
function findOriginal(original: string, changedWord: string): string {
  const words = original.split(/\s+/)
  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    if (clean === changedWord) return w
    // Levenshtein distance kecil? skip — cukup tampilkan "?"
  }
  return "?"
}
