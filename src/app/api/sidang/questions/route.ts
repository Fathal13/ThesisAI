import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from("sidang_questions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get sidang questions error:", error)
      return NextResponse.json({ error: "Gagal mengambil pertanyaan" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Get sidang questions catch:", error)
    return NextResponse.json({ error: "Gagal mengambil pertanyaan" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
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

    const { id, favorit, mastered, user_answer } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (typeof favorit === "boolean") updateData.favorit = favorit
    if (typeof mastered === "boolean") updateData.mastered = mastered
    if (typeof user_answer === "string") updateData.user_answer = user_answer

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 })
    }

    const { error } = await supabase
      .from("sidang_questions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Update sidang question error:", error)
      return NextResponse.json({ error: "Gagal mengupdate pertanyaan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update sidang question catch:", error)
    return NextResponse.json({ error: "Gagal mengupdate pertanyaan" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
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

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    const { error } = await supabase
      .from("sidang_questions")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Delete sidang question error:", error)
      return NextResponse.json({ error: "Gagal menghapus pertanyaan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete sidang question catch:", error)
    return NextResponse.json({ error: "Gagal menghapus pertanyaan" }, { status: 500 })
  }
}