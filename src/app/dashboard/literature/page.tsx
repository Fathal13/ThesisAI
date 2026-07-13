"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, BookOpen, Loader2, ExternalLink, FileText, Sparkles, ChevronLeft, ChevronRight, Bookmark, Trash2, Unlock, Lock, PenLine } from "lucide-react"
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

interface OpenAlexResult extends LiteratureResult {
  openAccessPdf: string | null
  oaStatus: string | null
  citationCount: number
}

type SearchResult = LiteratureResult | OpenAlexResult

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

function isOpenAlexResult(item: SearchResult): item is OpenAlexResult {
  return "openAccessPdf" in item
}

export default function LiteraturePage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [searchSource, setSearchSource] = useState<"openalex" | "crossref">("openalex")

  // Collection state
  const [collection, setCollection] = useState<CollectionItem[]>([])
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [collectionSearch, setCollectionSearch] = useState("")
  const [activeTab, setActiveTab] = useState("cari")

  // Article opening state
  const [openingArticle, setOpeningArticle] = useState<string | null>(null)

  // Convert to bab state
  const [convertToBab, setConvertToBab] = useState<{ id: string; judul: string } | null>(null)
  const [convertBabNumber, setConvertBabNumber] = useState(2)
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null)

  const search = useCallback(async (pageNum = 0) => {
    if (!query || query.length < 3) {
      setError("Minimal 3 karakter untuk mencari.")
      return
    }

    setLoading(true)
    setError("")
    setSearched(true)

    try {
      if (searchSource === "openalex") {
        const res = await fetch(`/api/literature/search-openalex?q=${encodeURIComponent(query)}&page=${pageNum}&perPage=20`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? "Gagal mencari")
          return
        }

        setResults(data.results)
        setTotalFiltered(data.total ?? 0)
        setTotalItems(data.total ?? 0)
        setPage(data.page)
      } else {
        const res = await fetch(`/api/literature/search?q=${encodeURIComponent(query)}&page=${pageNum}&journalOnly=true`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? "Gagal mencari")
          return
        }

        setResults(data.results)
        setTotalFiltered(data.totalFiltered ?? 0)
        setTotalItems(data.totalItems ?? 0)
        setPage(data.page)
      }
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [query, searchSource])

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

  async function handleSaveToCollection(item: SearchResult) {
    const saveKey = item.doi ?? `${item.title}_${item.year}`
    setSavingMap((prev) => ({ ...prev, [saveKey]: true }))
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

  async function handleSummarize(item: SearchResult) {
    if (summaries[item.title]) {
      setExpanded((prev) => (prev === item.title ? null : item.title))
      return
    }

    setSummarizing(item.title)

    try {
      // Coba enrichment dulu untuk dapetin TLDR (Semantic Scholar)
      // TLDR lebih akurat karena dari full-text
      let abstractForAI = item.abstract

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
          // Kalau ada TLDR dari Semantic Scholar, pakai itu sebagai abstract pengganti
          if (enrichData?.tldr?.text) {
            abstractForAI = `TLDR (AI-generated summary): ${enrichData.tldr.text}\n\nOriginal Abstract: ${abstractForAI ?? "N/A"}`
          }
        } catch {
          // silent — fallback ke abstract original
        }
      }

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

  async function handleOpenArticle(item: SearchResult) {
    // OpenAlex results langsung punya PDF
    if (isOpenAlexResult(item) && item.openAccessPdf) {
      window.open(item.openAccessPdf, "_blank", "noopener,noreferrer")
      return
    }

    if (!item.doi) {
      if (item.url) {
        window.open(item.url, "_blank", "noopener,noreferrer")
        return
      }
      alert("Artikel ini tidak memiliki URL.")
      return
    }

    // Coba enrichment untuk CrossRef results
    setOpeningArticle(item.doi)
    setError("")

    try {
      // Coba OpenAlex dulu (lebih cepat, langsung OA check)
      const oaRes = await fetch(`https://api.openalex.org/works/doi:${item.doi}?mailto=thesisai@app`, {
        signal: AbortSignal.timeout(6000),
      })
      if (oaRes.ok) {
        const oaData = await oaRes.json()
        const pdfUrl = oaData?.best_oa_location?.pdf_url ?? oaData?.primary_location?.pdf_url ?? null
        if (pdfUrl) {
          window.open(pdfUrl, "_blank", "noopener,noreferrer")
          return
        }
      }
    } catch {
      // silent
    } finally {
      setOpeningArticle(null)
    }

    // Fallback: coba enrichment (Semantic Scholar -> Unpaywall)
    setOpeningArticle(item.doi)
    try {
      const res = await fetch("/api/literature/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: item.doi, title: item.title, abstract: item.abstract }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Final fallback: buka halaman landing
        const landingUrl = item.url || `https://doi.org/${item.doi}`
        if (confirm(`Artikel ini mungkin tidak Open Access.\n\nBuka halaman artikel di ${landingUrl}?`)) {
          window.open(landingUrl, "_blank", "noopener,noreferrer")
        }
        return
      }

      const pdfUrl = data?.openAccessPdf?.url
      if (pdfUrl) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer")
      } else {
        const landingUrl = data?.url || item.url || `https://doi.org/${item.doi}`
        if (confirm(`Artikel ini mungkin tidak Open Access.\n\nBuka halaman artikel di ${landingUrl}?`)) {
          window.open(landingUrl, "_blank", "noopener,noreferrer")
        }
      }
    } catch {
      const landingUrl = item.url || `https://doi.org/${item.doi}`
      if (confirm(`Gagal mengecek ketersediaan artikel.\n\nBuka halaman artikel di ${landingUrl}?`)) {
        window.open(landingUrl, "_blank", "noopener,noreferrer")
      }
    } finally {
      setOpeningArticle(null)
    }
  }

  async function handleConvertToBab() {
    if (!convertToBab) return

    setConverting(true)
    setConvertSuccess(null)

    try {
      const res = await fetch("/api/literature/convert-to-bab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          literatureId: convertToBab.id,
          babNumber: convertBabNumber,
          judulSkripsi: "Skripsi",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error ?? "Gagal membuat draft bab")
        return
      }

      setConvertSuccess(`Draft berhasil ditambahkan ke Bab ${convertBabNumber}!`)
      setTimeout(() => setConvertSuccess(null), 3000)
    } catch {
      alert("Gagal membuat draft bab. Coba lagi.")
    } finally {
      setConverting(false)
      setConvertToBab(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search(0)
  }

  const totalPages = Math.ceil(results.length / 20)

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
          Cari artikel ilmiah, rangkum dengan AI, jadikan draft BAB.
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
          {/* Source Toggle */}
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setSearchSource("openalex"); setResults([]); setSearched(false) }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                searchSource === "openalex"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Unlock className="size-3.5" />
              Open Access
            </button>
            <button
              onClick={() => { setSearchSource("crossref"); setResults([]); setSearched(false) }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                searchSource === "crossref"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Lock className="size-3.5" />
              Semua Artikel
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={searchSource === "openalex" ? "Cari artikel Open Access..." : "Cari topik, judul, atau penulis..."}
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

          {/* Search info */}
          <div className="text-xs text-muted-foreground">
            {searchSource === "openalex" ? (
              <span>🔓 Hanya menampilkan artikel <strong>Open Access</strong> dari OpenAlex — bisa langsung baca PDF.</span>
            ) : (
              <span>🔍 Semua artikel dari CrossRef (termasuk yang tidak Open Access). Hasil tidak terbatas pada Indonesia.</span>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Mencari artikel...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                <span>
                  Menampilkan halaman <strong>{page + 1}</strong> ({results.length} hasil)
                  {searchSource === "openalex" && (
                    <span> · <strong>{totalItems.toLocaleString("id-ID")}</strong> artikel Open Access</span>
                  )}
                  {searchSource === "crossref" && totalFiltered > 0 && (
                    <span> dari <strong>{totalFiltered}</strong> hasil relevan · <strong>{totalItems.toLocaleString("id-ID")}</strong> tersedia</span>
                  )}
                </span>
              </div>

              <div className="space-y-4">
                {results.map((item) => {
                  const hasSummary = !!summaries[item.title]
                  const isExpanded = expanded === item.title
                  const isSummarizing = summarizing === item.title
                  const saveKey = item.doi ?? `${item.title}_${item.year}`
                  const isSaving = savingMap[saveKey]
                  const alreadySaved = collection.some((c) => c.judul === item.title || c.doi === item.doi)
                  const oaResult = isOpenAlexResult(item) ? (item as OpenAlexResult) : null

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
                          {searchSource === "openalex" && oaResult?.oaStatus && (
                            <Badge variant="default" className="text-xs bg-green-600 dark:bg-green-700 gap-1">
                              <Unlock className="size-3" />
                              {oaResult.oaStatus}
                            </Badge>
                          )}
                          {searchSource === "crossref" && (
                            <Badge variant="outline" className="text-xs">
                              CrossRef
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

                          {/* Buka Artikel */}
                          {oaResult?.openAccessPdf ? (
                            <a href={oaResult.openAccessPdf} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <ExternalLink className="size-3.5" />
                                Buka Artikel
                              </Button>
                            </a>
                          ) : item.doi || item.url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenArticle(item)}
                              disabled={openingArticle === item.doi}
                              className="gap-1.5"
                            >
                              {openingArticle === item.doi ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              {openingArticle === item.doi ? "Membuka..." : "Buka Artikel"}
                            </Button>
                          ) : null}

                          {item.doi && (
                            <span className="text-xs text-muted-foreground self-center ml-auto">
                              {oaResult?.citationCount ? `📚 ${oaResult.citationCount} sitasi · ` : ""}
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
              <p className="text-sm mt-1">
                {searchSource === "openalex" ? "OpenAlex — 250+ juta artikel Open Access" : "CrossRef — akses ke jutaan artikel akademik"}
              </p>
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

          {/* Success message */}
          {convertSuccess && (
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm">
              ✅ {convertSuccess}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── CONVERT TO BAB DIALOG ─── */}
      {convertToBab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Jadikan Draft BAB</h3>
            <p className="text-sm text-muted-foreground">
              Buat draft dari literatur:
            </p>
            <p className="text-sm font-medium line-clamp-2">{convertToBab.judul}</p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Masukkan ke BAB nomor:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setConvertBabNumber(num)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      convertBabNumber === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setConvertToBab(null); setConvertBabNumber(2) }}
                disabled={converting}
              >
                Batal
              </Button>
              <Button
                onClick={handleConvertToBab}
                disabled={converting}
              >
                {converting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {converting ? "Membuat..." : "Buat Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Sumber: OpenAlex (OA) · CrossRef · Semantic Scholar · Rangkuman AI · Verifikasi dengan artikel asli.
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