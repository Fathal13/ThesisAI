"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, BookOpen, Loader2, ExternalLink, FileText, Sparkles, ChevronLeft, ChevronRight, Bookmark, Trash2, Newspaper, Book, GraduationCap, FileStack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AcademicDisclaimerSimple } from "@/components/disclaimer"

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

const TYPE_ICONS: Record<string, { icon: string; label: string }> = {
  "journal-article": { icon: "📄", label: "Jurnal" },
  "proceedings-article": { icon: "🎤", label: "Prosiding" },
  "book-chapter": { icon: "📖", label: "Bab Buku" },
  book: { icon: "📘", label: "Buku" },
  monograph: { icon: "📕", label: "Monograf" },
  "reference-entry": { icon: "📑", label: "Entri Referensi" },
  dataset: { icon: "📊", label: "Dataset" },
  report: { icon: "📋", label: "Laporan" },
}

function getTypeDisplay(type: string): { icon: string; label: string } {
  return TYPE_ICONS[type] ?? { icon: "📄", label: type.replace("-", " ") }
}

export default function LiteraturePage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LiteratureResult[]>([])
  const [total, setTotal] = useState(0) // hasil ditampilkan di halaman ini
  const [totalFiltered, setTotalFiltered] = useState(0) // hasil setelah filter & dedup
  const [totalItems, setTotalItems] = useState(0) // total tersedia di CrossRef
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>({})
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Collection state
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [collectionSearch, setCollectionSearch] = useState("")
  const [activeTab, setActiveTab] = useState("cari")

  const [searchKeywords, setSearchKeywords] = useState<string | null>(null)
  const [journalOnly, setJournalOnly] = useState(true) // default: filter jurnal saja

  const search = useCallback(async (pageNum = 0) => {
    if (!query || query.length < 3) {
      setError("Minimal 3 karakter untuk mencari.")
      return
    }

    setLoading(true)
    setError("")
    setSearched(true)
    setSearchKeywords(null)

    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(query)}&page=${pageNum}&journalOnly=${journalOnly}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Gagal mencari")
        return
      }

      setResults(data.results)
      setTotal(data.total ?? data.results.length)
      setTotalFiltered(data.totalFiltered ?? 0)
      setTotalItems(data.totalItems ?? 0)
      setTypeBreakdown(data.typeBreakdown ?? {})
      setPage(data.page)
      if (data.searchQuery) setSearchKeywords(data.searchQuery)
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [query, journalOnly])

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
    // Fetch collection count on mount (for badge count), dan saat tab berubah
    fetchCollection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function handleSaveToCollection(item: LiteratureResult) {
    setSavingMap((prev) => ({ ...prev, [item.title]: true }))
    try {
      await fetch("/api/literature/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: item.title,
          penulis: item.author,
          tahun: item.year,
          doi: item.doi,
          link: item.url,
          abstrak: item.abstract,
        }),
      })
    } catch {
      // silent
    } finally {
      setSavingMap((prev) => ({ ...prev, [item.title]: false }))
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

  const totalPages = Math.ceil(totalFiltered / 10)

  const filteredCollection = collection.filter((item) => {
    if (!collectionSearch) return true
    const q = collectionSearch.toLowerCase()
    return (
      item.judul.toLowerCase().includes(q) ||
      item.penulis.toLowerCase().includes(q)
    )
  })

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

      <AcademicDisclaimerSimple />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "cari")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="cari" className="flex-1 sm:flex-none">🔍 Cari</TabsTrigger>
          <TabsTrigger value="koleksi" className="flex-1 sm:flex-none">
            📚 Koleksi Saya ({collection.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: CARI ─── */}
        <TabsContent value="cari" className="mt-6 space-y-6">
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

          {/* Filter: Jurnal saja */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={journalOnly}
              onChange={(e) => setJournalOnly(e.target.checked)}
              className="size-4 rounded border-input bg-background text-primary focus:ring-primary"
            />
            <span className="text-muted-foreground">📄 Jurnal saja (sembunyikan buku, dataset, dll)</span>
          </label>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Search tips */}
          <div className="text-xs text-muted-foreground mb-4">
            💡 Tips: Gunakan kata kunci spesifik (mis. Artificial Intelligence, Lapangan Pekerjaan).
            Hasil tidak terbatas pada Indonesia — mencakup jurnal internasional via CrossRef.
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Mencari artikel...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              {searchKeywords && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>🔍 Kata kunci:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{searchKeywords}</code>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                <span>
                  Menampilkan halaman <strong>{page + 1}</strong> ({results.length} hasil)
                  {totalFiltered > 0 && <span> dari <strong>{totalFiltered}</strong> hasil relevan</span>}
                  {totalItems > 0 && <span> · <strong>{totalItems.toLocaleString("id-ID")}</strong> tersedia di CrossRef</span>}
                </span>
              </div>
              {/* Type breakdown */}
              {Object.keys(typeBreakdown).length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(typeBreakdown).map(([type, count]) => {
                    const { icon, label } = getTypeDisplay(type)
                    return (
                      <Badge key={type} variant="secondary" className="text-xs gap-1">
                        <span>{icon}</span>
                        <span>{label}</span>
                        <span className="ml-0.5 font-semibold">{count}</span>
                      </Badge>
                    )
                  })}
                </div>
              )}

              <div className="space-y-4">
                {results.map((item) => {
                  const hasSummary = !!summaries[item.title]
                  const isExpanded = expanded === item.title
                  const isSummarizing = summarizing === item.title
                  const isSaving = savingMap[item.title]
                  const alreadySaved = collection.some((c) => c.judul === item.title || c.doi === item.doi)

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
                            <Badge variant="secondary" className="text-xs gap-1">
                              <span>{getTypeDisplay(item.type).icon}</span>
                              <span>{getTypeDisplay(item.type).label}</span>
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
                              <Bookmark className={cn("size-3.5", alreadySaved && "fill-primary text-primary")} />
                            )}
                            {alreadySaved ? "Tersimpan" : "Simpan"}
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
        </TabsContent>

        {/* ─── TAB: KOLEKSI ─── */}
        <TabsContent value="koleksi" className="mt-6 space-y-6">
          {/* Search koleksi */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari di koleksi..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="pl-9"
              aria-label="Cari di koleksi"
            />
          </div>

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
                {filteredCollection.length} literatur tersimpan
              </p>
              {filteredCollection.map((item) => (
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
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <ExternalLink className="size-3.5" />
                            Buka Artikel
                          </Button>
                        </a>
                      )}
                      {item.doi && (
                        <span className="text-xs text-muted-foreground self-center">DOI: {item.doi}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFromCollection(item.id)}
                        className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Sumber: CrossRef API (gratis) · Rangkuman AI · Verifikasi dengan artikel asli.
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
