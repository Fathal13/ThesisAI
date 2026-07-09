"use client"

import { useState, useEffect } from "react"
import { BarChart3, Loader2, CalendarDays, Target, TrendingUp, GraduationCap, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { Bab as BabType, Progress as ProgressType } from "@/types"

interface Bab {
  id: string
  judul: string
  nomor_bab: number
  status: "draft" | "review" | "revisi" | "selesai"
  target_selesai: string | null
}

interface ProgressData {
  total_bab: number
  bab_selesai: number
  deadline_sidang: string | null
  judul_skripsi: string | null
}

const BAB_NAMES: Record<number, string> = {
  1: "Bab 1: Pendahuluan",
  2: "Bab 2: Tinjauan Pustaka",
  3: "Bab 3: Metodologi",
  4: "Bab 4: Hasil & Pembahasan",
  5: "Bab 5: Kesimpulan",
}

function daysUntil(dateStr: string): { days: number; label: string; urgent: boolean } {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return { days: Math.abs(diff), label: `${Math.abs(diff)} hari sudah lewat!`, urgent: true }
  if (diff === 0) return { days: 0, label: "Hari ini! 🔥", urgent: true }
  if (diff <= 7) return { days: diff, label: `${diff} hari lagi 🏃`, urgent: true }
  return { days: diff, label: `${diff} hari lagi`, urgent: false }
}

export default function ProgressPage() {
  const [babList, setBabList] = useState<Bab[]>([])
  const [progress, setProgress] = useState<ProgressData>({ total_bab: 5, bab_selesai: 0, deadline_sidang: null, judul_skripsi: null })
  const [loading, setLoading] = useState(true)
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState("")
  const [motivasi, setMotivasi] = useState("")

  async function fetchData() {
    try {
      const { supabase } = await import("@/lib/supabase")

      const [babRes, progRes] = await Promise.all([
        supabase.from("bab").select("*").order("nomor_bab", { ascending: true }),
        supabase.from("progress").select("*").single().then(r => r as unknown as { data: ProgressData | null; error: Record<string, any> }), // eslint-disable-line @typescript-eslint/no-explicit-any
      ])

      if (babRes.data) setBabList(babRes.data as unknown as Bab[])
      if (progRes.data) {
        setProgress(progRes.data)
        if (progRes.data.deadline_sidang) setDeadlineInput(progRes.data.deadline_sidang)
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() // eslint-disable-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateMotivasi() {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "motivasi",
          data: { nama: "Mahasiswa", progress: progress.bab_selesai },
        }),
      })
      const data = await res.json()
      // Clean up the response from our AI route
      try {
        const parsed = JSON.parse(data.result?.replace(/```(json)?\n?/g, "") ?? "")
        // It's not JSON, just use the text
        // Actually our motivasi endpoint returns plain text inside result
      } catch {}
      if (data.result) setMotivasi(data.result)
    } catch {}
  }

  useEffect(() => {
    if (progress.bab_selesai > 0 && !motivasi) { generateMotivasi() } // eslint-disable-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.bab_selesai])

  async function saveDeadline() {
    try {
      const { supabase } = await import("@/lib/supabase")
      await (supabase.from("progress") as any).upsert({ // eslint-disable-line @typescript-eslint/no-explicit-any
        deadline_sidang: deadlineInput || null,
      }, { onConflict: "user_id" })
      setProgress({ ...progress, deadline_sidang: deadlineInput || null })
      setEditingDeadline(false)
    } catch {}
  }

  const selesaiCount = babList.filter((b) => b.status === "selesai").length
  const pct = progress.total_bab > 0 ? Math.round((selesaiCount / progress.total_bab) * 100) : 0
  const deadlineInfo = progress.deadline_sidang ? daysUntil(progress.deadline_sidang) : null

  const statusEmoji: Record<string, string> = {
    draft: "📝",
    review: "🔍",
    revisi: "🔄",
    selesai: "✅",
  }

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    review: "Siap Review",
    revisi: "Revisi",
    selesai: "Selesai",
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
          <BarChart3 className="size-7 text-primary" />
          Progress Skripsi
        </h1>
        <p className="text-muted-foreground mt-1">
          Pantau perkembangan skripsimu dari Bab 1 sampai sidang.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pct}%</p>
                <p className="text-xs text-muted-foreground">Skripsi Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <GraduationCap className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{selesaiCount}/{progress.total_bab}</p>
                <p className="text-xs text-muted-foreground">Bab Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <CalendarDays className="size-5 text-purple-600" />
              </div>
              <div>
                {deadlineInfo ? (
                  <>
                    <p className="text-2xl font-bold">{deadlineInfo.days} hari</p>
                    <p className="text-xs text-muted-foreground">{deadlineInfo.label}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Belum diatur</p>
                    <p className="text-xs text-muted-foreground">Set deadline sidang</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <TrendingUp className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {selesaiCount === 0 ? "Belum mulai" :
                   selesaiCount <= 2 ? "Ayo semangat!" :
                   selesaiCount <= 4 ? "Mantap!" :
                   "Hampir selesai! 🎉"}
                </p>
                <p className="text-xs text-muted-foreground">Semangat terus!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium">Progress Keseluruhan</p>
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-4" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Setting */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Deadline Sidang</p>
                <p className="text-sm text-muted-foreground">
                  {progress.deadline_sidang
                    ? `${new Date(progress.deadline_sidang).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                    : "Belum diatur"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingDeadline(!editingDeadline)}>
              {progress.deadline_sidang ? "Ubah" : "Atur"}
            </Button>
          </div>

          {editingDeadline && (
            <div className="flex gap-3 mt-4">
              <Input
                type="date"
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
              />
              <Button size="sm" onClick={saveDeadline}>Simpan</Button>
              <Button variant="outline" size="sm" onClick={() => setEditingDeadline(false)}>Batal</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Bab Progress */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Detail Per Bab</h2>
        <div className="space-y-3">
          {Array.from({ length: progress.total_bab }, (_, i) => {
            const num = i + 1
            const bab = babList.find((b) => b.nomor_bab === num)
            const isSelesai = bab?.status === "selesai"

            return (
              <Card key={num} className={isSelesai ? "border-emerald-200 dark:border-emerald-800" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{statusEmoji[bab?.status ?? "draft"]}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {BAB_NAMES[num]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bab
                            ? statusLabel[bab.status]
                            : "Belum mulai"}
                          {bab?.target_selesai && ` · Target: ${new Date(bab.target_selesai).toLocaleDateString("id-ID")}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isSelesai ? "default" : "outline"}>
                      {isSelesai ? "✅ Selesai" : bab ? `📄 ${statusLabel[bab.status]}` : "⬜ Belum diisi"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Motivasi */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">💪 Semangat!</p>
              <p className="text-muted-foreground">
                {motivasi || "Terus lanjutin! Setiap bab yang selesai adalah langkah lebih dekat ke sidang."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
