"use client"

import { useState, useEffect } from "react"
import { Brain, Loader2, Sparkles, ChevronDown, ChevronUp, Bookmark, CheckCircle, RefreshCw, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { SidangDisclaimer } from "@/components/disclaimer"

interface Bab {
  id: string
  judul: string
  nomor_bab: number
  konten: string
}

interface Question {
  id: string
  question: string
  category: "Metodologi" | "Teori" | "Hasil" | "Impak"
  sampleAnswer: string
  userAnswer: string
  favorit: boolean
  mastered: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  Metodologi: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Teori: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Hasil: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  Impak: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

function QuestionCard({
  question,
  isExpanded,
  onToggle,
  onUpdate,
  onEvaluate,
  evaluating,
  allQuestions,
}: {
  question: Question
  index: number
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (updates: Partial<Question>) => void
  onEvaluate: () => void
  evaluating: boolean
  allQuestions: Question[]
}) {
  const q = question
  const i = allQuestions.indexOf(q)

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
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
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onUpdate({ favorit: !q.favorit }) }}
              aria-label={q.favorit ? "Hapus favorit" : "Simpan favorit"}
            >
              <Bookmark
                className={cn("size-4", q.favorit && "fill-primary text-primary")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onUpdate({ mastered: !q.mastered }) }}
              aria-label={q.mastered ? "Tandai belum dikuasai" : "Tandai dikuasai"}
            >
              <CheckCircle
                className={cn("size-4", q.mastered && "text-emerald-500 fill-emerald-500")}
              />
            </Button>
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <Separator className="mb-3" />

          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-medium">💡 Contoh Jawaban:</p>
            <div className="text-sm p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
              {q.sampleAnswer}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Ini adalah contoh jawaban untuk latihan. Jawaban sidang asli harus sesuai dengan isi skripsimu.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">✍️ Tulis Jawabanmu:</label>
            <Textarea
              value={q.userAnswer}
              onChange={(e) => onUpdate({ userAnswer: e.target.value })}
              placeholder="Tulis jawabanmu di sini untuk latihan..."
              rows={4}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEvaluate}
              disabled={evaluating || !q.userAnswer.trim()}
              className="gap-1.5"
            >
              {evaluating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {evaluating ? "Mengevaluasi..." : "Bandingkan dengan AI"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ userAnswer: "" })}
              className="gap-1.5 text-muted-foreground"
            >
              <RefreshCw className="size-3.5" />
              Hapus Jawaban
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            {q.mastered
              ? "✅ Sudah dikuasai — bagus! Lanjut pertanyaan berikutnya."
              : "📝 Belum dikuasai — tulis jawabanmu lalu klik Bandingkan dengan AI"}
          </p>
        </CardContent>
      )}
    </Card>
  )
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
  const [evaluating, setEvaluating] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "favorit" | "mastered" | "unmastered">("all")

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((data as any)?.judul_skripsi) setJudulSkripsi((data as any).judul_skripsi as string)
    } catch {}
  }

  async function fetchSavedQuestions() {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data } = await supabase
        .from("sidang_questions")
        .select("*")
        .order("created_at", { ascending: true })

      const items = data as unknown as Array<Record<string, unknown>>
      if (items && items.length > 0) {
        setQuestions(items.map((q) => ({
          id: q.id as string,
          question: q.pertanyaan as string,
          category: q.kategori as "Metodologi" | "Teori" | "Hasil" | "Impak",
          sampleAnswer: (q.jawaban_ai as string) ?? "",
          userAnswer: (q.user_answer as string) ?? "",
          favorit: (q.favorit as boolean) ?? false,
          mastered: (q.mastered as boolean) ?? false,
        })))
        // Auto-select bab dari pertanyaan terakhir
        const lastQ = items[items.length - 1]
        if (lastQ.bab_id) {
          setSelectedBab(lastQ.bab_id as string)
        }
      }
    } catch {}
  }

  useEffect(() => { fetchBab(); fetchProgress(); fetchSavedQuestions() } // eslint-disable-line react-hooks/set-state-in-effect
  , [])

  async function handleGenerate() {
    if (!selectedBab) return
    const bab = babList.find((b) => b.id === selectedBab)
    if (!bab || !bab.konten) { setError("Bab ini masih kosong. Tulis kontennya dulu di halaman Writing."); return }
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
      setQuestions(data.map((q: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        ...q,
        id: crypto.randomUUID(),
        userAnswer: q.userAnswer ?? "",
        favorit: q.favorit ?? false,
        mastered: q.mastered ?? false,
      })))
      setError("")
    } catch { setError("Gagal generate pertanyaan. Coba lagi.") }
    finally { setLoading(false) }
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

  function updateQuestion(index: number, updates: Partial<Question>) {
    const next = [...questions]
    next[index] = { ...next[index], ...updates }
    setQuestions(next)
  }

  async function evaluateAnswer(index: number) {
    const q = questions[index]
    if (!q || !q.userAnswer.trim()) return
    setEvaluating(index)
    try {
      const res = await fetch("/api/sidang/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pertanyaan: q.question, jawabanUser: q.userAnswer, jawabanAI: q.sampleAnswer }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Gagal evaluasi"); return }
      alert("Evaluasi AI:\n\n" + (data.join ? data.join("\n") : data))
    } catch { setError("Gagal evaluasi. Coba lagi.") }
    finally { setEvaluating(null) }
  }

  function handlePrint() { window.print() }

  async function handleSaveAll() {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const payload = questions.map((q) => ({
        user_id: session.user.id,
        bab_id: selectedBab,
        pertanyaan: q.question,
        kategori: q.category,
        jawaban_ai: q.sampleAnswer,
        user_answer: q.userAnswer,
        mastered: q.mastered,
        favorit: q.favorit,
      }))
      const { error: err } = await (supabase.from("sidang_questions") as any).upsert(payload) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err) { setError("Gagal simpan: " + err.message); return }
      setError("✅ Disimpan ke database!")
      setTimeout(() => setError(""), 3000)
    } catch { setError("Gagal menyimpan") }
  }

  const tabCounts = {
    all: questions.length,
    favorit: questions.filter((q) => q.favorit).length,
    mastered: questions.filter((q) => q.mastered).length,
    unmastered: questions.filter((q) => !q.mastered).length,
  }

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === "favorit") return q.favorit
    if (activeTab === "mastered") return q.mastered
    if (activeTab === "unmastered") return !q.mastered
    return true
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="size-7 text-primary" />
          Sidang Prep Generator
        </h1>
        <p className="text-muted-foreground mt-1">Generate prediksi pertanyaan sidang berdasarkan bab yang sudah kamu tulis.</p>
      </div>
      <SidangDisclaimer />

      {/* Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Persiapan</CardTitle>
          <CardDescription>Pilih bab dan isi judul skripsi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Judul Skripsi</p>
              <p className="text-sm text-muted-foreground">{judulSkripsi || <span className="italic">Belum diisi</span>}</p>
            </div>
            <Button variant="outline" size="sm" onClick={updateJudulSkripsi}>
              {judulSkripsi ? "Ubah" : "Isi Judul"}
            </Button>
          </div>
          <Separator />
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
                  <SelectValue placeholder="Pilih bab yang mau dijadikan pertanyaan">
                    {selectedBab && babList.find((b) => b.id === selectedBab)
                      ? `Bab ${babList.find((b) => b.id === selectedBab)!.nomor_bab} — ${babList.find((b) => b.id === selectedBab)!.judul}`
                      : "Pilih bab yang mau dijadikan pertanyaan"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto">
                  {babList.length === 0 ? (
                    <SelectItem value="-" disabled>Tulis bab dulu di halaman Writing</SelectItem>
                  ) : (
                    babList.map((bab) => (
                      <SelectItem
                        key={bab.id}
                        value={bab.id}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      >
                        Bab {bab.nomor_bab} — {bab.judul}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          {error && error.includes("⚠") ? (
            <p className="text-sm text-emerald-600">{error}</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button onClick={handleGenerate} disabled={loading || !selectedBab} className="gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "AI sedang menganalisis..." : "Generate Pertanyaan"}
          </Button>
        </CardContent>
      </Card>

      {/* Questions Section */}
      {questions.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">{questions.length} Pertanyaan 🎯</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="size-4" /> Cetak / PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveAll} className="gap-2">
                <Bookmark className="size-4" /> Simpan ke DB
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4 mb-5">
              <TabsTrigger value="all">Semua ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="favorit">⭐ Favorit ({tabCounts.favorit})</TabsTrigger>
              <TabsTrigger value="mastered">✅ Dikuasai ({tabCounts.mastered})</TabsTrigger>
              <TabsTrigger value="unmastered">📝 Belum ({tabCounts.unmastered})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="size-12 mx-auto mb-4 opacity-30" />
              <p>Tidak ada pertanyaan untuk filter ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const i = questions.indexOf(q)
                return (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    isExpanded={expandedQ === i}
                    onToggle={() => setExpandedQ(expandedQ === i ? null : i)}
                    onUpdate={(updates) => updateQuestion(i, updates)}
                    onEvaluate={() => evaluateAnswer(i)}
                    evaluating={evaluating === i}
                    allQuestions={questions}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}