import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { summarizeLiterature } from "@/lib/ai"

export async function POST(req: Request) {
  const { title, abstract, articleUrl, doi } = await req.json()

  if (!title) {
    return NextResponse.json({ error: "Judul diperlukan" }, { status: 400 })
  }

  // Identifier unik untuk cache: DOI > URL > title hash
  const articleId = doi ?? articleUrl ?? title.slice(0, 200)

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Read-only — only reading session
          },
        },
      }
    )

    // Ambil session user
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 })
    }

    // === CEK CACHE ===
    const { data: cached } = await supabase
      .from("summary_cache")
      .select("rangkuman")
      .eq("article_identifier", articleId)
      .eq("user_id", userId)
      .maybeSingle()

    if (cached?.rangkuman) {
      console.log(`[Cache] Hit for article: ${title.slice(0, 60)}`)
      return NextResponse.json(cached.rangkuman)
    }

    // === GENERATE RANGKUMAN via AI ===
    console.log(`[Cache] Miss — generating summary for: ${title.slice(0, 60)}`)
    const result = await summarizeLiterature(title, abstract ?? "Tidak tersedia")

    // === SIMPAN KE CACHE ===
    const { error: upsertError } = await supabase.from("summary_cache").upsert(
      {
        user_id: userId,
        article_identifier: articleId,
        title: title.slice(0, 500),
        rangkuman: result,
      },
      { onConflict: "user_id, article_identifier", ignoreDuplicates: false },
    )

    if (upsertError) {
      console.error("[Cache] Failed to save summary:", upsertError.message)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI summarize error:", error)
    return NextResponse.json(
      { error: "Gagal merangkum artikel. Coba lagi nanti." },
      { status: 500 },
    )
  }
}
