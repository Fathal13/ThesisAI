"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Search,
  BookOpen,
  Loader2,
  ExternalLink,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Trash2,
  Unlock,
  PenLine,
  Filter,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AcademicDisclaimerSimple } from "@/components/disclaimer"
import { summarizeQueue, type QueueItemMeta } from "@/lib/summarize-queue"

// ─── Types ───

interface OpenAlexResult {
  doi: string | null
  title: string
  author: string
  year: number | null
  source: string
  url: string
  abstract: string | null
  type: string
  openAccessPdf: string | null
  oaStatus: string | null
  citationCount: number
}

interface CollectionItem {
  id: string
  judul: string
  penulis: string
  tahun: number | null
  doi: string | null
  link: string | null
  abstrak: string | null
  created_at: string
}

interface Summary {
  problem: string
  method: string
  result: string
  gap: string
}

// ─── Type Helpers ───

const TYPE_ICONS: Record<string, { icon: string; label: string }> = {
  article: { icon: "📄", label: "Artikel Jurnal" },
  review: { icon: "📋", label: "Review" },
  book: { icon: "📘", label: "Buku" },
  "book-chapter": { icon: "📖", label: "Bab Buku" },
  preprint: { icon: "🔬", label: "Preprint" },
  dataset: { icon: "📊", label: "Dataset" },
  dissertation: { icon: "🎓", label: "Disertasi" },
  report: { icon: "📋", label: "Laporan" },
}

function getTypeDisplay(type: string): { icon: string; label: string } {
  return TYPE_ICONS[type] ?? { icon: "📄", label: type.replace("-", " ") }
}

function getOAStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    gold: "bg-yellow-500 dark:bg-yellow-600",
    green: "bg-green-600 dark:bg-green-700",
    hybrid: "bg-blue-600 dark:bg-blue-700",
    bronze: "bg-orange-600 dark:bg-orange-700",
    closed: "bg-gray-500 dark:bg-gray-600",
  }
  return colors[status ?? ""] ?? "bg-green-600 dark:bg-green-700"
}

function getOAStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    gold: "Gold OA",
    green: "Green OA",
    hybrid: "Hybrid OA",
    bronze: "Bronze OA",
    closed: "Closed",
  }
  return labels[status ?? ""] ?? "Open Access"
}

// ─── Component ───

export default function LiteraturePage() {
  // Search state
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<OpenAlexResult[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)
  const [searchInfo, setSearchInfo] = useState("")
  const [journalOnly, setJournalOnly] = useState(true)

  // Summary state
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  // Collection state
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [collectionSearch, setCollectionSearch] = useState("")
  const [activeTab, setActiveTab] = useState("cari")

  // Convert to bab state
  const [convertToBab, setConvertToBab] = useState<{ id: string; judul: string } | null>(null)
  const [convertBabNumber, setConvertBabNumber] = useState(2)
  const [convertJudulSkripsi, setConvertJudulSkripsi] = useState("")
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState<{ message: string; babId: string } | null>(null)

  // ─── Queue state ───
  const [queueSnapshot, setQueueSnapshot] = useState<QueueItemMeta[]>([])
  useEffect(() => {
    return summarizeQueue.subscribe(() => {
      setQueueSnapshot([...summarizeQueue.getSnapshot()])
    })
  }, [])

  const queueInfo = queueSnapshot.filter((q) => q.status === "pending")
  const queueActiveLabel =
    queueSnapshot.find((q) => q.status === "processing")?.label || null

  // ─── Search ───

  const search = useCallback(
    async (pageNum = 0) => {
      if (!query || query.length < 3) {
        setError("Minimal 3 karakter untuk mencari.")
        return
      }

      setLoading(true)
      setError("")
      setSearched(true)

      try {
        const params = new URLSearchParams({
          q: query,
          page: String(pageNum),
          perPage: "20",
          journalOnly: String(journalOnly),
        })
        const res = await fetch(`/api/literature/search-openalex?${params}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? "Gagal mencari")
          return
        }

        setResults(data.results)
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 0)
        setPage(data.page)
        setSearchInfo(data.message ?? "")
      } catch {
        setError("Gagal terhubung ke server. Coba lagi.")
      } finally {
        setLoading(false)
      }
    },
    [query, journalOnly],
  )

  function handleSearch() {
    search(0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search(0)
  }

  // ─── Collection ───

  async function fetchCollection() {
    setCollectionLoading(true)
    try {
      const res = await fetch("/api/literature/collection")
      const data = await res.json()
      if (Array.isArray(data)) setCollection(data)
    } catch {
      // silent
    } finally {
      setCollectionLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadCollection() {
      setCollectionLoading(true)
      try {
        const res = await fetch("/api/literature/collection")
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) setCollection(data)
      } catch {
        // silent
      } finally {
        if (!cancelled) setCollectionLoading(false)
      }
    }
    loadCollection()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  async function handleSaveToCollection(item: OpenAlexResult) {
    const saveKey = item.doi ?? `${item.title}_${item.year}`
    setSavingMap((prev) => ({ ...prev, [saveKey]: true }))
    try {
      const res = await fetch("/api/literature/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: item.title,
          penulis: item.author,
          tahun: item.year,
          doi: item.doi,
          link: item.openAccessPdf ?? item.url,
          abstrak: item.abstract,
        }),
      })
      const data = await res.json()
      if (!data.success && !data.existing) {
        setError("Gagal menyimpan artikel")
      }
    } catch {
      setError("Gagal menyimpan. Coba lagi.")
    } finally {
      setSavingMap((prev) => ({ ...prev, [saveKey]: false }))
      fetchCollection()
    }
  }

  async function handleDeleteFromCollection(id: string) {
    if (!confirm("Hapus literatur ini dari koleksi?")) return
    try {
      await fetch("/api/literature/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setCollection((prev) => prev.filter((item) => item.id !== id))
    } catch {
      // silent
    }
  }

  // ─── Buka Artikel (PDF langsung dari OpenAlex) ───

  function handleOpenArticle(item: OpenAlexResult) {
    // OpenAlex sudah punya PDF URL langsung — buka aja
    if (item.openAccessPdf) {
      window.open(item.openAccessPdf, "_blank", "noopener,noreferrer")
      return
    }

    // Fallback ke landing page
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer")
      return
    }

    // Fallback ke DOI
    if (item.doi) {
      window.open(`https://doi.org/${item.doi}`, "_blank", "noopener,noreferrer")
      return
    }

    alert("Artikel ini tidak memiliki URL atau PDF.")
  }

  // ─── Rangkum dengan AI ───

  async function handleSummarize(item: OpenAlexResult) {
    if (summaries[item.title]) {
      setExpanded((prev) => (prev === item.title ? null : item.title))
      return
    }

    setSummarizing(item.title)

    try {
      let abstractForAI = item.abstract

      // Coba enrichment dulu untuk dapetin TLDR (Semantic Scholar)
      if (item.doi) {
        try {
          const enrichRes = await fetch("/api/literature/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doi: item.doi,
              title: item.title,
              abstract: item.abstract,
            }),
          })
          const enrichData = await enrichRes.json()
          if (enrichData?.tldr?.text) {
            abstractForAI = `TLDR (AI-generated summary): ${enrichData.tldr.text}\n\nOriginal Abstract: ${abstractForAI ?? "N/A"}`
          }
        } catch {
          // silent — fallback ke abstract original
        }
      }

      // Enqueue ke antrian daripada langsung fetch
      const data = await summarizeQueue.enqueue(`Merangkum "${item.title.slice(0, 50)}..."`, async () => {
        const res = await fetch("/api/literature/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            abstract: abstractForAI,
            doi: item.doi,
            articleUrl: item.url,
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error ?? "Gagal merangkum")
        return result
      }) as Summary

      setSummaries((prev) => ({ ...prev, [item.title]: data }))
      setExpanded(item.title)
    } catch {
      setError("Gagal merangkum. Coba lagi.")
    } finally {
      setSummarizing(null)
    }
  }

  // ─── Rangkum dari Koleksi (CollectionItem) ───

  async function handleSummarizeFromCollection(item: CollectionItem) {
    if (summaries[item.judul]) {
      setExpanded((prev) => (prev === item.judul ? null : item.judul))
      return
    }

    setSummarizing(item.judul)

    try {
      let abstractForAI = item.abstrak

      // Coba enrichment dulu untuk dapetin TLDR (Semantic Scholar)
      if (item.doi) {
        try {
          const enrichRes = await fetch("/api/literature/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doi: item.doi,
              title: item.judul,
              abstract: item.abstrak,
            }),
          })
          const enrichData = await enrichRes.json()
          if (enrichData?.tldr?.text) {
            abstractForAI = `TLDR (AI-generated summary): ${enrichData.tldr.text}\n\nOriginal Abstract: ${abstractForAI ?? "N/A"}`
          }
        } catch {
          // silent — fallback ke abstract original
        }
      }

      // Enqueue ke antrian daripada langsung fetch
      const data = await summarizeQueue.enqueue(`Merangkum "${item.judul.slice(0, 50)}..."`, async () => {
        const res = await fetch("/api/literature/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.judul,
            abstract: abstractForAI,
            doi: item.doi,
            articleUrl: item.link,
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error ?? "Gagal merangkum")
        return result
      }) as Summary

      setSummaries((prev) => ({ ...prev, [item.judul]: data }))
      setExpanded(item.judul)
    } catch {
      setError("Gagal merangkum. Coba lagi.")
    } finally {
      setSummarizing(null)
    }
  }

  // ─── Convert to Bab ───

  async function handleConvertToBab() {
    if (!convertToBab || !convertJudulSkripsi.trim()) {
      alert("Masukkan judul skripsi terlebih dahulu")
      return
    }
    setConverting(true)
    setConvertSuccess(null)
    try {
      const res = await fetch("/api/literature/convert-to-bab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          literatureId: convertToBab.id,
          babNumber: convertBabNumber,
          judulSkripsi: convertJudulSkripsi.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? "Gagal membuat draft bab")
        return
      }
      setConvertSuccess({
        message: `Draft berhasil ${data.replaced ? "diperbarui di" : "dibuat di"} Bab ${convertBabNumber}!`,
        babId: data.babId,
      })
      // Auto-redirect ke Writing page setelah 2 detik
      setTimeout(() => {
        window.location.href = `/dashboard/writing?bab=${data.babId}`
      }, 2000)
    } catch {
      alert("Gagal membuat draft bab. Coba lagi.")
    } finally {
      setConverting(false)
      // Jangan reset convertToBab di sini biar user bisa lihat success message
    }
  }

  // ─── Derived ───

  const filteredCollection = collection.filter((item) => {
    if (!collectionSearch) return true
    const q = collectionSearch.toLowerCase()
    return item.judul.toLowerCase().includes(q) || item.penulis.toLowerCase().includes(q)
  })

  // ─── Collection Pagination ───
  const COLLECTION_PAGE_SIZE = 10
  const [collectionPage, setCollectionPage] = useState(0)
  const totalCollectionPages = Math.max(1, Math.ceil(filteredCollection.length / COLLECTION_PAGE_SIZE))
  const paginatedCollection = filteredCollection.slice(
    collectionPage * COLLECTION_PAGE_SIZE,
    (collectionPage + 1) * COLLECTION_PAGE_SIZE,
  )
    // Reset page when search/filter changes — handled in onChange below

  // ─── Render ───

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="size-7 text-primary" />
          Literatur Explorer
        </h1>
        <p className="text-muted-foreground mt-1">
          Cari artikel ilmiah Open Access, rangkum dengan AI, simpan ke koleksi, dan jadikan draft BAB.
        </p>
      </div>

      <AcademicDisclaimerSimple />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "cari")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="cari" className="flex-1 sm:flex-none">
            🔍 Cari
          </TabsTrigger>
          <TabsTrigger value="koleksi" className="flex-1 sm:flex-none">
            📚 Koleksi Saya ({collection.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: CARI ─── */}
        <TabsContent value="cari" className="mt-6 space-y-6">
          {/* Info bar — OpenAlex source */}
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg px-4 py-2.5 text-sm">
            <Unlock className="size-4 text-green-600 shrink-0" />
            <span className="text-green-800 dark:text-green-300">
              Mencari di <strong>OpenAlex</strong> — 250+ juta artikel <strong>Open Access</strong> dengan akses PDF langsung.
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari topik, judul, atau penulis..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 h-12 text-base"
                aria-label="Kata kunci pencarian"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || query.length < 3}
              className="h-12 px-6"
            >
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Cari
            </Button>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filter:</span>
            </div>
            <button
              type="button"
              onClick={() => setJournalOnly((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                journalOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground border-border",
              )}
              aria-label="Toggle filter jurnal saja"
            >
              <Unlock className={cn("size-3.5", journalOnly ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{journalOnly ? "Artikel jurnal saja" : "Semua tipe artikel"}</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Queue status */}
          {(queueActiveLabel || queueInfo.length > 0) && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              <Clock className="size-4 shrink-0 animate-pulse" />
              <span>
                {queueActiveLabel && (
                  <><strong>Sedang memproses:</strong> {queueActiveLabel}</>
                )}
                {queueInfo.length > 0 && (
                  <> · <strong>{queueInfo.length} antrean</strong> menunggu</>
                )}
              </span>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Mencari artikel...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Search info — jumlah artikel, halaman */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                <span>🔍 {searchInfo}</span>
              </div>

              <div className="space-y-4">
                {results.map((item) => {
                  const hasSummary = !!summaries[item.title]
                  const isExpanded = expanded === item.title
                  const isSummarizing = summarizing === item.title
                  const saveKey = item.doi ?? `${item.title}_${item.year}`
                  const isSaving = savingMap[saveKey]
                  const alreadySaved = collection.some(
                    (c) => c.judul === item.title || (c.doi && item.doi && c.doi === item.doi),
                  )
                  const hasPdf = !!item.openAccessPdf

                  return (
                    <Card key={item.doi ?? item.title + item.year} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-base leading-snug">
                              {item.title}
                            </CardTitle>
                            <CardDescription>
                              {item.author} · {item.year ?? "Tahun tidak diketahui"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* Type badge */}
                          <Badge variant="secondary" className="text-xs gap-1">
                            <span>{getTypeDisplay(item.type).icon}</span>
                            <span>{getTypeDisplay(item.type).label}</span>
                          </Badge>

                          {/* OA Status badge */}
                          {item.oaStatus && (
                            <Badge
                              variant="default"
                              className={cn("text-xs gap-1 text-white", getOAStatusColor(item.oaStatus))}
                            >
                              <Unlock className="size-3" />
                              {getOAStatusLabel(item.oaStatus)}
                            </Badge>
                          )}

                          {/* PDF available */}
                          {hasPdf && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400 gap-1">
                              <ExternalLink className="size-3" />
                              PDF Tersedia
                            </Badge>
                          )}

                          {/* Citation count */}
                          {item.citationCount > 0 && (
                            <Badge variant="outline" className="text-xs gap-1">
                              📚 {item.citationCount.toLocaleString("id-ID")} sitasi
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {/* Abstract */}
                        {item.abstract && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {item.abstract}
                          </p>
                        )}

                        {/* DOI */}
                        {item.doi && (
                          <p className="text-xs text-muted-foreground mb-3 font-mono">
                            DOI: {item.doi}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* 1. Buka Artikel */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenArticle(item)}
                            className="gap-1.5"
                          >
                            <ExternalLink className="size-3.5" />
                            Buka Artikel
                          </Button>

                          {/* 2. Simpan ke Koleksi */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveToCollection(item)}
                            disabled={isSaving || alreadySaved}
                            className="gap-1.5"
                          >
                            {isSaving ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Bookmark
                                className={cn("size-3.5", alreadySaved && "fill-primary text-primary")}
                              />
                            )}
                            {alreadySaved ? "Tersimpan" : "Simpan"}
                          </Button>

                          {/* 3. Rangkum dengan AI */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSummarize(item)}
                            disabled={isSummarizing}
                            className="gap-1.5"
                          >
                            {isSummarizing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : hasSummary ? (
                              <FileText className="size-3.5" />
                            ) : (
                              <Sparkles className="size-3.5" />
                            )}
                            {isSummarizing
                              ? "Merangkum..."
                              : hasSummary
                                ? "Lihat Rangkuman"
                                : "Rangkum dengan AI"}
                          </Button>
                        </div>

                        {/* Summary Detail */}
                        {isExpanded && hasSummary && (
                          <>
                            <Separator className="my-4" />
                            <div className="grid gap-3 text-sm">
                              <SummaryItem label="🎯 Masalah" text={summaries[item.title].problem} />
                              <SummaryItem label="🔧 Metode" text={summaries[item.title].method} />
                              <SummaryItem label="📊 Hasil" text={summaries[item.title].result} />
                              <SummaryItem label="🕳️ Gap" text={summaries[item.title].gap} />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <span className="text-xs text-muted-foreground order-2 sm:order-1">
                    Halaman {page + 1} dari {totalPages} · {total.toLocaleString("id-ID")} artikel ditemukan
                  </span>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => search(page - 1)}
                      disabled={page === 0 || loading}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Sebelumnya
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {generatePageNumbers(page, totalPages).map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={p}
                            variant={page === p ? "default" : "outline"}
                            size="icon"
                            className="size-8 text-xs"
                            onClick={() => search(p as number)}
                            disabled={loading}
                          >
                            {(p as number) + 1}
                          </Button>
                        ),
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => search(page + 1)}
                      disabled={page >= totalPages - 1 || loading}
                    >
                      Selanjutnya
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : searched ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="size-12 mx-auto mb-4 opacity-30" />
              <p>Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
              <p className="text-sm mt-1">Coba dengan kata kunci lain yang lebih spesifik.</p>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="size-12 mx-auto mb-4 opacity-30" />
              <p>Cari artikel ilmiah Open Access untuk skripsimu</p>
              <p className="text-sm mt-1">
                OpenAlex — 250+ juta artikel Open Access dari berbagai disiplin ilmu
              </p>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB: KOLEKSI SAYA ─── */}
        <TabsContent value="koleksi" className="mt-6 space-y-6">
          {/* Queue status */}
          {(queueActiveLabel || queueInfo.length > 0) && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              <Clock className="size-4 shrink-0 animate-pulse" />
              <span>
                {queueActiveLabel && (
                  <><strong>Sedang memproses:</strong> {queueActiveLabel}</>
                )}
                {queueInfo.length > 0 && (
                  <> · <strong>{queueInfo.length} antrean</strong> menunggu</>
                )}
              </span>
            </div>
          )}

          {/* Search koleksi */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari di koleksi..."
              value={collectionSearch}
              onChange={(e) => { setCollectionSearch(e.target.value); setCollectionPage(0) }}
              className="pl-9"
              aria-label="Cari di koleksi"
            />
          </div>

          {/* Success message convert */}
          {convertSuccess && (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400 text-sm space-y-2">
              <p>✅ {convertSuccess.message}</p>
              <p className="text-xs opacity-75">Mengarahkan ke halaman Writing...</p>
            </div>
          )}

          {collectionLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredCollection.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Bookmark className="size-12 mx-auto mb-4 opacity-30" />
              {collection.length === 0 ? (
                <>
                  <p>Belum ada literatur tersimpan</p>
                  <p className="text-sm mt-1">Cari artikel di tab &ldquo;Cari&rdquo; lalu klik Simpan.</p>
                </>
              ) : (
                <>
                  <p>Tidak ada hasil untuk &ldquo;{collectionSearch}&rdquo;</p>
                  <p className="text-sm mt-1">Coba kata kunci lain.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan {paginatedCollection.length} dari {filteredCollection.length} literatur tersimpan
                {filteredCollection.length > COLLECTION_PAGE_SIZE && (
                  <> · Halaman {collectionPage + 1} dari {totalCollectionPages}</>
                )}
              </p>
              {paginatedCollection.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base leading-snug">{item.judul}</CardTitle>
                        <CardDescription>
                          {item.penulis || "Penulis tidak diketahui"}
                          {item.tahun ? ` · ${item.tahun}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {item.abstrak && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{item.abstrak}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {/* Buka Artikel dari koleksi */}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <Button variant="default" size="sm" className="gap-1.5">
                            <ExternalLink className="size-3.5" />
                            Buka Artikel
                          </Button>
                        </a>
                      )}

                      {item.doi && (
                        <span className="text-xs text-muted-foreground self-center font-mono">
                          DOI: {item.doi}
                        </span>
                      )}

                      {/* Rangkum dengan AI */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSummarizeFromCollection(item)}
                        disabled={summarizing === item.judul}
                        className="gap-1.5"
                      >
                        {summarizing === item.judul ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : summaries[item.judul] ? (
                          <FileText className="size-3.5" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        {summarizing === item.judul
                          ? "Merangkum..."
                          : summaries[item.judul]
                            ? "Lihat Rangkuman"
                            : "Rangkum dengan AI"}
                      </Button>

                      {/* Jadikan BAB */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setConvertToBab({ id: item.id, judul: item.judul })}
                        className="gap-1.5 ml-auto"
                      >
                        <PenLine className="size-3.5" />
                        Jadikan BAB
                      </Button>

                      {/* Hapus */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFromCollection(item.id)}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </Button>
                    </div>

                    {/* Summary Detail untuk koleksi */}
                    {expanded === item.judul && summaries[item.judul] && (
                      <>
                        <Separator className="my-4" />
                        <div className="grid gap-3 text-sm">
                          <SummaryItem label="🎯 Masalah" text={summaries[item.judul].problem} />
                          <SummaryItem label="🔧 Metode" text={summaries[item.judul].method} />
                          <SummaryItem label="📊 Hasil" text={summaries[item.judul].result} />
                          <SummaryItem label="🕳️ Gap" text={summaries[item.judul].gap} />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Collection Pagination */}
              {totalCollectionPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <span className="text-xs text-muted-foreground order-2 sm:order-1">
                    Halaman {collectionPage + 1} dari {totalCollectionPages}
                  </span>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCollectionPage(Math.max(0, collectionPage - 1))}
                      disabled={collectionPage === 0}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {collectionPage + 1} / {totalCollectionPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCollectionPage(Math.min(totalCollectionPages - 1, collectionPage + 1))}
                      disabled={collectionPage === totalCollectionPages - 1}
                    >
                      Selanjutnya
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── CONVERT TO BAB DIALOG ─── */}
      {convertToBab && !converting && !convertSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-5">
            <h3 className="text-lg font-semibold">Jadikan Draft BAB dengan AI</h3>

            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Artikel referensi:</p>
              <p className="text-sm font-medium line-clamp-2 bg-muted/50 rounded-lg p-3">{convertToBab.judul}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Judul Skripsimu</label>
              <Input
                placeholder="Misal: Pengaruh AI terhadap Kinerja Karyawan"
                value={convertJudulSkripsi}
                onChange={(e) => setConvertJudulSkripsi(e.target.value)}
                aria-label="Judul skripsi"
              />
              <p className="text-xs text-muted-foreground">Judul ini akan dipakai AI untuk menulis draft bab yang sesuai.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target BAB nomor:</label>
              <div className="flex gap-2">
                {[
                  { num: 1, label: "Pendahuluan" },
                  { num: 2, label: "Tinjauan Pustaka" },
                  { num: 3, label: "Metodologi" },
                  { num: 4, label: "Hasil & Pembahasan" },
                  { num: 5, label: "Kesimpulan" },
                ].map(({ num, label }) => (
                  <button
                    key={num}
                    onClick={() => setConvertBabNumber(num)}
                    className={cn(
                      "flex flex-1 flex-col items-center py-2.5 px-1 rounded-lg text-xs font-medium transition-colors border",
                      convertBabNumber === num
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground border-border",
                    )}
                  >
                    <span className="text-sm font-bold">{num}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-medium">⚡ Yang akan terjadi:</p>
              <ol className="list-decimal list-inside space-y-0.5 opacity-80">
                <li>AI akan membaca judul, abstrak, dan rangkuman artikel</li>
                <li>AI menulis draft bab skripsi berdasarkan artikel ini (±400-800 kata)</li>
                <li>Draft disimpan otomatis sebagai bab baru di halaman Writing</li>
                <li>Kamu bisa langsung edit draftnya di sana</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setConvertToBab(null)
                  setConvertBabNumber(2)
                  setConvertJudulSkripsi("")
                }}
              >
                Batal
              </Button>
              <Button onClick={handleConvertToBab} disabled={!convertJudulSkripsi.trim()}>
                <Sparkles className="size-4 mr-2" />
                Generate Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for convert */}
      {converting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-4 text-center">
            <Loader2 className="size-10 animate-spin text-primary mx-auto" />
            <p className="font-semibold text-lg">AI sedang menulis draft...</p>
            <p className="text-sm text-muted-foreground">
              AI membaca artikel dan menulis draft bab {convertBabNumber} berdasarkan referensi ini.
            </p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Sumber: OpenAlex · Semantic Scholar · Rangkuman AI · Verifikasi dengan artikel asli.
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ───

function SummaryItem({ label, text }: { label: string; text: string }) {
  if (!text || text === "Gagal merangkum") return null
  return (
    <div>
      <p className="font-medium text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }

  const pages: (number | "...")[] = []

  // Always show first page
  pages.push(0)

  if (current > 2) {
    pages.push("...")
  }

  // Pages around current
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 3) {
    pages.push("...")
  }

  // Always show last page
  pages.push(total - 1)

  return pages
}