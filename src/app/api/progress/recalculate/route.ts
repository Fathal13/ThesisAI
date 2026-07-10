import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST() {
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
            // Read-only
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Hitung jumlah bab yang sudah selesai
    const { data: babList, error: babError } = await supabase
      .from("bab")
      .select("status")
      .eq("user_id", session.user.id)

    if (babError) {
      return NextResponse.json({ error: babError.message }, { status: 500 })
    }

    const babSelesai = babList?.filter((b) => b.status === "selesai").length ?? 0
    const totalBab = 5

    // Upsert progress
    const { error: upsertError } = await supabase.from("progress").upsert(
      {
        user_id: session.user.id,
        bab_selesai: babSelesai,
        total_bab: totalBab,
      },
      { onConflict: "user_id" },
    )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ bab_selesai: babSelesai, total_bab: totalBab })
  } catch (error) {
    console.error("Progress recalculate error:", error)
    return NextResponse.json({ error: "Gagal update progress" }, { status: 500 })
  }
}