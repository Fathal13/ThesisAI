import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    // Generate draft untuk bab
    const rangkumanSection = lit.rangkuman ? `
### Ringkasan Artikel (AI)
**Masalah**: ${lit.rangkuman.problem}
**Metode**: ${lit.rangkuman.method}
**Hasil**: ${lit.rangkuman.result}
**Gap**: ${lit.rangkuman.gap}
` : lit.abstrak ? `
### Abstrak
${lit.abstrak}
` : ""

    const draftContent = `
## ${lit.judul}

### Referensi Utama
- **Judul**: ${lit.judul}
- **Penulis**: ${lit.penulis}
- **Tahun**: ${lit.tahun ?? "N/A"}
- **DOI**: ${lit.doi ?? "N/A"}
- **Link**: ${lit.link ?? "N/A"}

${rangkumanSection}

### Ide untuk Bab ${babNumber} - ${judulSkripsi}
<!-- Tulis ide pengembangan bab di sini berdasarkan artikel ini -->
- Poin 1: ...
- Poin 2: ...
- Poin 3: ...

---

*Draft otomatis dibuat dari literatur tersimpan. Silakan edit dan kembangkan.*
    `.trim()

    // Cek apakah bab sudah ada
    const { data: existingBab } = await supabase
      .from("bab")
      .select("id, konten")
      .eq("user_id", session.user.id)
      .eq("nomor_bab", babNumber)
      .single()

    if (existingBab) {
      // Append ke bab existing
      const newContent = `${existingBab.konten}\n\n---\n\n${draftContent}`
      const { error: updateError } = await supabase
        .from("bab")
        .update({ konten: newContent, updated_at: new Date().toISOString() })
        .eq("id", existingBab.id)

      if (updateError) throw updateError
      return NextResponse.json({ success: true, appended: true, babId: existingBab.id })
    } else {
      // Buat bab baru
      const { data: newBab, error: createError } = await supabase
        .from("bab")
        .insert({
          user_id: session.user.id,
          judul: `Bab ${babNumber} - ${judulSkripsi}`,
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