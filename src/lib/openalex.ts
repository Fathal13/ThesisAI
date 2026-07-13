/**
 * OpenAlex API — Open Access literature search
 * Docs: https://docs.openalex.org/
 * Rate limit: 100 req/s (no key needed)
 */

const CURRENT_YEAR = new Date().getFullYear()
const MIN_VALID_YEAR = 1900

function isValidYear(year: number | null): number | null {
  if (!year) return null
  if (year < MIN_VALID_YEAR || year > CURRENT_YEAR + 1) return null // +1 untuk preprint tahun depan
  return year
}

export interface OpenAlexResult {
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

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string
  authorships: Array<{ author: { display_name: string } }>
  publication_year: number | null
  open_access: {
    is_oa: boolean
    oa_status: "gold" | "green" | "hybrid" | "bronze" | "closed" | null
    oa_url: string | null
    any_repository_has_fulltext: boolean
  }
  cited_by_count: number
  concepts: Array<{ display_name: string; score: number }>
  abstract_inverted_index: Record<string, number[]> | null
  primary_location: {
    source: { display_name: string; type: string } | null
    pdf_url: string | null
    landing_page_url: string | null
  } | null
  best_oa_location: {
    pdf_url: string | null
    landing_page_url: string | null
    source: { display_name: string } | null
  } | null
}

/**
 * Reconstruct abstract from OpenAlex inverted index format
 * OpenAlex menyimpan abstract sebagai inverted index untuk efisiensi
 */
function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string | null {
  if (!invertedIndex) return null
  const positions: Array<[number, string]> = []
  for (const [word, posArray] of Object.entries(invertedIndex)) {
    for (const pos of posArray) positions.push([pos, word])
  }
  positions.sort((a, b) => a[0] - b[0])
  return positions.map((p) => p[1]).join(" ")
}

/**
 * Cari artikel Open Access via OpenAlex API
 * Filter otomatis: hanya artikel dengan open_access.is_oa = true
 */
export async function searchOpenAlex(
  query: string,
  page = 0,
  perPage = 20,
): Promise<{ results: OpenAlexResult[]; total: number }> {
  const url = new URL("https://api.openalex.org/works")
  url.searchParams.set("filter", "open_access.is_oa:true")
  url.searchParams.set("search", query)
  url.searchParams.set("page", String(page + 1))
  url.searchParams.set("per-page", String(perPage))
  url.searchParams.set("sort", "publication_year:desc")
  url.searchParams.set("mailto", "thesisai@app")

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)" },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`OpenAlex responded ${res.status}`)
  }

  const data = await res.json()
  const items: OpenAlexWork[] = data.results ?? []

  const results: OpenAlexResult[] = items.map((item) => {
    // Cari PDF URL — prioritas: best_oa_location → primary_location → open_access.oa_url
    let pdfUrl = item.best_oa_location?.pdf_url ?? null
    if (!pdfUrl) pdfUrl = item.primary_location?.pdf_url ?? null
    if (!pdfUrl) pdfUrl = item.open_access?.oa_url ?? null

    // Cari landing page
    const landingUrl =
      item.best_oa_location?.landing_page_url ??
      item.primary_location?.landing_page_url ??
      item.doi?.replace("https://doi.org/", "https://doi.org/") ??
      null

    let doi = item.doi ?? null
    if (doi?.startsWith("https://doi.org/")) doi = doi.replace("https://doi.org/", "")

    return {
      doi,
      title: item.title ?? "No title",
      author:
        item.authorships
          ?.map((a) => a.author.display_name)
          .join(", ")
          .slice(0, 500) ?? "Unknown",
      year: isValidYear(item.publication_year),
      source:
        item.primary_location?.source?.display_name ??
        item.best_oa_location?.source?.display_name ??
        "",
      url: landingUrl ?? `https://openalex.org/${item.id}`,
      abstract: reconstructAbstract(item.abstract_inverted_index),
      type: "journal-article",
      openAccessPdf: pdfUrl,
      oaStatus: item.open_access?.oa_status ?? null,
      citationCount: item.cited_by_count ?? 0,
    }
  })

  return { results, total: data.meta?.count ?? 0 }
}

/**
 * Cari artikel spesifik via DOI di OpenAlex
 * Return enriched data termasuk OA status
 */
export async function getOpenAlexByDoi(doi: string): Promise<OpenAlexResult | null> {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, "")
  const url = new URL(`https://api.openalex.org/works/doi:${cleanDoi}`)
  url.searchParams.set("mailto", "thesisai@app")

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "ThesisAI/1.0 (mailto:thesisai@app)" },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`OpenAlex DOI ${res.status}`)
    }

    const data: OpenAlexWork = await res.json()

    let pdfUrl = data.best_oa_location?.pdf_url ?? null
    if (!pdfUrl) pdfUrl = data.primary_location?.pdf_url ?? null
    if (!pdfUrl) pdfUrl = data.open_access?.oa_url ?? null

    let cleanDoi2 = data.doi ?? null
    if (cleanDoi2?.startsWith("https://doi.org/")) cleanDoi2 = cleanDoi2.replace("https://doi.org/", "")

    return {
      doi: cleanDoi2,
      title: data.title ?? "No title",
      author:
        data.authorships
          ?.map((a) => a.author.display_name)
          .join(", ")
          .slice(0, 500) ?? "Unknown",
      year: isValidYear(data.publication_year),
      source:
        data.primary_location?.source?.display_name ??
        data.best_oa_location?.source?.display_name ??
        "",
      url: data.best_oa_location?.landing_page_url ?? data.primary_location?.landing_page_url ?? "",
      abstract: reconstructAbstract(data.abstract_inverted_index),
      type: "journal-article",
      openAccessPdf: pdfUrl,
      oaStatus: data.open_access?.oa_status ?? null,
      citationCount: data.cited_by_count ?? 0,
    }
  } catch (err) {
    console.warn(`[OpenAlex] Failed to fetch ${doi}:`, err)
    return null
  }
}
