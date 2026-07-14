/**
 * Literature Enrichment — fetch full-text availability & metadata
 * Chain: Semantic Scholar → Unpaywall (fallback)
 */

export interface EnrichedPaper {
  doi: string
  title: string
  abstract: string | null
  openAccessPdf: { url: string; status: string } | null
  tldr: { text: string; model: string } | null
  citationCount: number
  influentialCitationCount: number
  source: "semantic-scholar" | "unpaywall" | "semantic-scholar+unpaywall" | null
  year: number | null
  authors: string[]
  venue: string | null
  url: string | null // landing page URL
}

interface SemanticScholarPaper {
  paperId: string
  title: string
  abstract: string | null
  year: number | null
  authors: Array<{ name: string }>
  venue: string | null
  openAccessPdf: { url: string; status: string } | null
  tldr: { text: string; model: string } | null
  citationCount: number
  influentialCitationCount: number
  url: string
  externalIds: { DOI?: string } | null
}

interface UnpaywallResponse {
  doi: string
  is_oa: boolean
  oa_status: "gold" | "green" | "hybrid" | "bronze" | "closed"
  best_oa_location: {
    url: string
    url_for_pdf: string
    version: string
    license: string
  } | null
  genre: string
  publisher: string
  journal_name: string
  published_date: string
  year: number
}

/**
 * Cek apakah paper punya versi Open Access via Semantic Scholar
 * Rate limit: 100 req/s (no key), 1000 req/5min with key
 */
export async function enrichViaSemanticScholar(doi: string): Promise<EnrichedPaper | null> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}` +
    `?fields=title,abstract,year,authors,venue,openAccessPdf,tldr,citationCount,influentialCitationCount,url,externalIds`

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)",
      },
      // Semantic Scholar recommend 1s timeout for free tier
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      if (res.status === 404) return null
      if (res.status === 429) throw new Error("RATE_LIMIT")
      throw new Error(`Semantic Scholar ${res.status}`)
    }

    const data: SemanticScholarPaper = await res.json()

    // Normalize
    return {
      doi,
      title: data.title,
      abstract: data.abstract,
      openAccessPdf: data.openAccessPdf,
      tldr: data.tldr,
      citationCount: data.citationCount ?? 0,
      influentialCitationCount: data.influentialCitationCount ?? 0,
      source: "semantic-scholar",
      year: data.year,
      authors: data.authors?.map((a) => a.name) ?? [],
      venue: data.venue,
      url: data.url,
    }
  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMIT") throw err
    console.warn(`[Enrich] Semantic Scholar failed for ${doi}:`, err)
    return null
  }
}

/**
 * Fallback ke Unpaywall untuk cek OA alternatif
 * Rate limit: ~1 req/s, butuh email
 */
export async function enrichViaUnpaywall(doi: string): Promise<EnrichedPaper | null> {
  const email = process.env.UNPAYWALL_EMAIL ?? "thesisai@app"
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ThesisAI/1.0" },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Unpaywall ${res.status}`)
    }

    const data: UnpaywallResponse = await res.json()

    if (!data.is_oa || !data.best_oa_location?.url_for_pdf) {
      return null
    }

    return {
      doi,
      title: "", // Unpaywall tidak return title reliable
      abstract: null,
      openAccessPdf: {
        url: data.best_oa_location.url_for_pdf,
        status: data.oa_status,
      },
      tldr: null,
      citationCount: 0,
      influentialCitationCount: 0,
      source: "unpaywall",
      year: data.year,
      authors: [],
      venue: data.journal_name,
      url: data.best_oa_location.url,
    }
  } catch (err) {
    console.warn(`[Enrich] Unpaywall failed for ${doi}:`, err)
    return null
  }
}

/**
 * Main enrichment function — chain SS → Unpaywall
 * Return null kalau tidak ditemukan OA di keduanya
 */
export async function enrichPaper(doi: string): Promise<EnrichedPaper | null> {
  if (!doi) return null

  // 1. Try Semantic Scholar first (better metadata + TLDR)
  let result: EnrichedPaper | null = null
  try {
    result = await enrichViaSemanticScholar(doi)
  } catch (err) {
    // Rate limit (429) atau error lain → lanjut ke Unpaywall
    console.warn(`[Enrich] Semantic Scholar error for ${doi}, trying Unpaywall:`, err)
  }

  // 2. Kalau Semantic Scholar tidak punya OA PDF, coba Unpaywall
  if (!result?.openAccessPdf?.url) {
    try {
      const unpaywallResult = await enrichViaUnpaywall(doi)
      if (unpaywallResult?.openAccessPdf?.url) {
        // Merge: gunakan metadata dari SS (kalau ada) + PDF dari Unpaywall
        if (result) {
          result = {
            ...result,
            openAccessPdf: unpaywallResult.openAccessPdf,
            source: "semantic-scholar+unpaywall",
          }
        } else {
          result = unpaywallResult
        }
      }
    } catch (err) {
      console.warn(`[Enrich] Unpaywall failed for ${doi}:`, err)
    }
  }

  return result
}