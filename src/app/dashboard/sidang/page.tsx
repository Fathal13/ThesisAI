"use client"

import { useState, useEffect } from "react"
import { Brain, Loader2, Sparkles, ChevronDown, ChevronUp, CheckCircle, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Progress as ProgressType } from "@/types"
import { SidangDisclaimer } from "@/components/disclaimer"

interface Bab {
  id: string
  judul: string
  nomor_bab: number
  konten: string
}

interface Question {
  question: string
  category: "Metodologi" | "Teori" | "Hasil" | "Impak"
  sampleAnswer: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Metodologi: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Teori: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Hasil: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  Impak: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

export default function SidangPage() {
  const [babList, setBabList] = useState<Bab[]>([])
  const [selectedBab, setSelectedBab] = useState<string>("")
  const [judulSkripsi, setJudulSkripsi] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBab, setLoadingBab] = useState(true)
  const [error, setError] = useState("")
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [savedQs, setSavedQs] = useState<Set<number>>(new Set())

  async function fetchBab() {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.from("bab").select("id, judul, nomor_bab, konten")
        .order("nomor_bab", { ascending: true })
      if (data) setBabList(data)
    } catch {}
    finally { setLoadingBab(false) }
  }

  async function fetchProgress() {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase.from("progress").select("judul_skripsi").single()
      if ((data as unknown as ProgressType | null)?.judul_skripsi) setJudulSkripsi((data as unknown as ProgressType).judul_skripsi as string)
    } catch {}
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchBab(); fetchProgress() }, [])

  async function handleGenerate() {
    if (!selectedBab) return

    const bab = babList.find((b) => b.id === selectedBab)
    if (!bab || !bab.konten) {
      setError("Bab ini masih kosong. Tulis kontennya dulu di halaman Writing.")
      return
    }

    const title = judulSkripsi || "Skripsi (judul belum diisi)"

    setLoading(true)
    setError("")
    setQuestions([])

    try {
      const res = await fetch("/api/sidang/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontenBab: bab.konten, judulSkripsi: title }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Gagal generate"); return }

      setQuestions(data)
    } catch {
      setError("Gagal generate pertanyaan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  async function updateJudulSkripsi() {
    const title = prompt("Masukkan judul skripsimu:", judulSkripsi)
    if (title) {
      setJudulSkripsi(title)
      try {
        const { supabase } = await import("@/lib/supabase")
        await (supabase.from("progress") as any).upsert({ judul_skripsi: title }, { onConflict: "user_id" }) // eslint-disable-line @typescript-eslint/no-explicit-any
      } catch {}
    }
  }

  function toggleSaved(index: number) {
    const next = new Set(savedQs)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSavedQs(next)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="size-7 text-primary" />
          Sidang Prep Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate prediksi pertanyaan sidang berdasarkan bab yang sudah kamu tulis.
        </p>
      </div>

      <SidangDisclaimer />

      {/* Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Persiapan</CardTitle>
          <CardDescription>Pilih bab dan isi judul skripsi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Judul Skripsi */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Judul Skripsi</p>
              <p className="text-sm text-muted-foreground">
                {judulSkripsi || <span className="italic">Belum diisi</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={updateJudulSkripsi}>
              {judulSkripsi ? "Ubah" : "Isi Judul"}
            </Button>
          </div>

          <Separator />

          {/* Pilih Bab */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Bab</label>
            {loadingBab ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat bab...
              </div>
            ) : (
              <Select value={selectedBab} onValueChange={(v) => setSelectedBab(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bab yang mau dijadikan pertanyaan" />
                </SelectTrigger>
                <SelectContent>
                  {babList.length === 0 ? (
                    <SelectItem value="-" disabled>Tulis bab dulu di halaman Writing</SelectItem>
                  ) : (
                    babList.map((bab) => (
                      <SelectItem key={bab.id} value={bab.id}>
                        Bab {bab.nomor_bab} — {bab.judul}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedBab}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {loading ? "AI sedang menganalisis..." : "Generate Pertanyaan"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {questions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {questions.length} Pertanyaan Terprediksi 🎯
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Disclaimer: Pertanyaan ini hanya prediksi AI untuk latihan. Jawabannya bersifat contoh — gunakan untuk referensi, bukan untuk disalin.
          </p>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold text-muted-foreground mt-0.5 w-6">
                        {i + 1}
                      </span>
                      <div>
                        <CardTitle className="text-sm font-medium leading-snug">
                          {q.question}
                        </CardTitle>
                        <Badge className={cn("mt-1.5 text-xs", CATEGORY_COLORS[q.category])}>
                          {q.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); toggleSaved(i) }}
                        aria-label={savedQs.has(i) ? "Unsave" : "Save"}
                      >
                        <Bookmark
                          className={cn(
                            "size-4",
                            savedQs.has(i) && "fill-primary text-primary"
                          )}
                        />
                      </Button>
                      {expandedQ === i ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedQ === i && (
                  <CardContent>
                    <Separator className="mb-3" />
                    <p className="text-sm text-muted-foreground mb-2 font-medium">
                      💡 Contoh Jawaban:
                    </p>
                    <div className="text-sm p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {q.sampleAnswer}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      ⚠️ Ini adalah contoh jawaban untuk latihan. Jawaban sidang asli harus sesuai dengan isi skripsimu.
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              AI: Google Gemini · Hasil tidak 100% akurat · Gunakan sebagai bahan latihan
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
