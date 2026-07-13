import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { enrichPaper, EnrichedPaper } from "@/lib/literature"

export async function POST(req: Request) {
  try {
    const { doi, title, abstract } = await req.json()

    if (!doi) {
      return NextResponse.json({ error: "DOI diperlukan" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only */ },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 })
    }

    // === CEK CACHE ENRICHMENT DULU ===
    // Graceful: kalau tabel enrichment_cache belum ada, skip cache
    try {
      const { data: cached } = await supabase
        .from("enrichment_cache")
        .select("*")
        .eq("doi", doi)
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (cached) {
        console.log(`[Enrich] Cache hit for ${doi}`)
        return NextResponse.json(cached.enrichment_data)
      }
    } catch {
      console.warn("[Enrich] Cache table not ready — skipping cache read")
    }

    // === ENRICHMENT VIA API ===
    console.log(`[Enrich] Fetching enrichment for ${doi}`)
    const enriched = await enrichPaper(doi)

    if (!enriched) {
      return NextResponse.json({
        doi,
        found: false,
        message: "Artikel tidak ditemukan di database enrichment atau tidak Open Access",
      })
    }

    // Merge dengan metadata lokal (title, abstract dari CrossRef)
    const result: EnrichedPaper = {
      ...enriched,
      title: enriched.title || title,
      abstract: enriched.abstract || abstract,
    }

    // === SIMPAN KE CACHE ===
    // Graceful: kalau gagal simpan cache (table blm ada / RLS), tetap return hasil
    try {
      const { error: upsertError } = await supabase.from("enrichment_cache").upsert(
        {
          user_id: session.user.id,
          doi,
          enrichment_data: result,
        },
        { onConflict: "user_id, doi", ignoreDuplicates: false },
      )

      if (upsertError) {
        console.error("[Enrich] Failed to save cache:", upsertError.message)
      }
    } catch {
      console.warn("[Enrich] Cache table not ready — skipping cache write")
    }

    return NextResponse.json({ ...result, found: true })
  } catch (error) {
    console.error("[Enrich] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil detail artikel. Coba lagi nanti." },
      { status: 500 },
    )
  }
}