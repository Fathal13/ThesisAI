import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateBabFromLiterature } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { literatureId, babNumber, judulSkripsi } = await req.json()

    if (!literatureId || !babNumber || !judulSkripsi) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Harus login" }, { status: 401 })
    }

    // Ambil literatur
    const { data: lit, error: litError } = await supabase
      .from("literatures")
      .select("*")
      .eq("id", literatureId)
      .eq("user_id", session.user.id)
      .single()

    if (litError || !lit) {
      return NextResponse.json({ error: "Literatur tidak ditemukan" }, { status: 404 })
    }

    // Generate draft BAB menggunakan AI
    let draftContent: string
    try {
      draftContent = await generateBabFromLiterature(
        lit.judul,
        lit.abstrak,
        lit.rangkuman as { problem: string; method: string; result: string; gap: string } | null,
        babNumber,
        judulSkripsi,
        lit.penulis,
        lit.tahun,
      )
    } catch (aiError) {
      console.error("[Convert to Bab] AI error:", aiError)
      // Fallback: buat draft minimal jika AI gagal
      const rangkuman = lit.rangkuman as Record<string, string> | null
      const rangkumanSection = rangkuman ? `
### Ringkasan Artikel (AI)
**Masalah**: ${rangkuman.problem ?? ""}
**Metode**: ${rangkuman.method ?? ""}
**Hasil**: ${rangkuman.result ?? ""}
**Gap**: ${rangkuman.gap ?? ""}
` : lit.abstrak ? `
### Abstrak
${lit.abstrak}
` : ""

      draftContent = `
## ${lit.judul}

### Referensi Utama
- **Penulis**: ${lit.penulis}
- **Tahun**: ${lit.tahun ?? "N/A"}
- **DOI**: ${lit.doi ?? "N/A"}

${rangkumanSection}

---

*Gagal generate dengan AI. Silakan edit manual.*
      `.trim()
    }

    // Cek apakah bab sudah ada
    const { data: existingBab } = await supabase
      .from("bab")
      .select("id, konten")
      .eq("user_id", session.user.id)
      .eq("nomor_bab", babNumber)
      .single()

    if (existingBab) {
      // REPLACE konten (bukan append) — draft baru dari artikel ini
      const { error: updateError } = await supabase
        .from("bab")
        .update({ konten: draftContent, updated_at: new Date().toISOString() })
        .eq("id", existingBab.id)

      if (updateError) throw updateError
      return NextResponse.json({ success: true, replaced: true, babId: existingBab.id })
    } else {
      // Buat bab baru
      const judulBab = BAB_LABELS[babNumber as keyof typeof BAB_LABELS] ?? `Bab ${babNumber}`
      const { data: newBab, error: createError } = await supabase
        .from("bab")
        .insert({
          user_id: session.user.id,
          judul: `${judulBab} — ${judulSkripsi}`,
          nomor_bab: babNumber,
          konten: draftContent,
          status: "draft",
        })
        .select("id")
        .single()

      if (createError) throw createError
      return NextResponse.json({ success: true, appended: false, babId: newBab.id })
    }
  } catch (error) {
    console.error("[Convert to Bab] Error:", error)
    return NextResponse.json(
      { error: "Gagal membuat draft bab. Coba lagi nanti." },
      { status: 500 },
    )
  }
}

const BAB_LABELS: Record<number, string> = {
  1: "Bab 1 — Pendahuluan",
  2: "Bab 2 — Tinjauan Pustaka",
  3: "Bab 3 — Metodologi Penelitian",
  4: "Bab 4 — Hasil dan Pembahasan",
  5: "Bab 5 — Kesimpulan dan Saran",
}