"use client"

import { useState, useCallback } from "react"
import { Search, BookOpen, Loader2, ExternalLink, FileText, Sparkles, ChevronLeft, ChevronRight, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface LiteratureResult {
  doi: string | null
  title: string
  author: string
  year: number | null
  source: string
  url: string
  abstract: string | null
  type: string
}

interface Summary {
  problem: string
  method: string
  result: string
  gap: string
}

export default function LiteraturePage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LiteratureResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (pageNum = 0) => {
    if (!query || query.length < 3) {
      setError("Minimal 3 karakter untuk mencari.")
      return
    }

    setLoading(true)
    setError("")
    setSearched(true)

    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(query)}&page=${pageNum}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Gagal mencari")
        return
      }

      setResults(data.results)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [query])

  async function handleSummarize(item: LiteratureResult) {
    if (summaries[item.title]) {
      setExpanded(expanded === item.title ? null : item.title)
      return
    }

    setSummarizing(item.title)

    try {
      const res = await fetch("/api/literature/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          abstract: item.abstract,
          doi: item.doi,
          articleUrl: item.url,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Gagal merangkum")
        return
      }

      setSummaries((prev) => ({ ...prev, [item.title]: data }))
      setExpanded(item.title)
    } catch {
      setError("Gagal merangkum. Coba lagi.")
    } finally {
      setSummarizing(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search(0)
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="size-7 text-primary" />
          Literatur Explorer
        </h1>
        <p className="text-muted-foreground mt-1">
          Cari artikel ilmiah dari CrossRef, rangkum dengan AI. Pas untuk Bab 2.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
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
          onClick={() => search(0)}
          disabled={loading || query.length < 3}
          className="h-12 px-6"
        >
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Cari
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
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
          <p className="text-sm text-muted-foreground">
            Menampilkan {results.length} dari {total.toLocaleString("id-ID")} hasil
          </p>

          <div className="space-y-4">
            {results.map((item) => {
              const hasSummary = !!summaries[item.title]
              const isExpanded = expanded === item.title
              const isSummarizing = summarizing === item.title

              return (
                <Card key={item.doi ?? item.title} className="overflow-hidden">
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
                      {item.type && (
                        <Badge variant="secondary" className="text-xs">
                          {item.type.replace("-", " ")}
                        </Badge>
                      )}
                      {item.source && (
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {item.abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {item.abstract}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
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
                        {isSummarizing ? "Merangkum..." : hasSummary ? "Lihat Rangkuman" : "Rangkum dengan AI"}
                      </Button>

                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <ExternalLink className="size-3.5" />
                            Buka Artikel
                          </Button>
                        </a>
                      )}

                      {item.doi && (
                        <span className="text-xs text-muted-foreground self-center ml-auto">
                          DOI: {item.doi}
                        </span>
                      )}
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
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => search(page - 1)}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="size-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {page + 1} dari {totalPages}
              </span>
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
          <p>Cari artikel ilmiah untuk skripsimu</p>
          <p className="text-sm mt-1">CrossRef — akses ke jutaan artikel akademik</p>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Sumber: CrossRef API (gratis) · Rangkuman by AI · Tidak 100% akurat, verifikasi dengan artikel asli.
        </p>
      </div>
    </div>
  )
}

function SummaryItem({ label, text }: { label: string; text: string }) {
  if (!text || text === "Gagal merangkum") return null
  return (
    <div>
      <p className="font-medium text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{text}</p>
    </div>
  )
}
