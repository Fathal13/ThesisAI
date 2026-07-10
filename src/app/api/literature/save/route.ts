import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
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

    const { judul, penulis, tahun, doi, link, abstrak } = await req.json()
    if (!judul) {
      return NextResponse.json({ error: "Judul diperlukan" }, { status: 400 })
    }

    const { error } = await supabase.from("literatures").upsert(
      {
        user_id: session.user.id,
        judul: judul.slice(0, 500),
        penulis: penulis ?? "",
        tahun: tahun ?? null,
        doi: doi ?? null,
        link: link ?? null,
        abstrak: abstrak ?? null,
      },
      { onConflict: "user_id, doi", ignoreDuplicates: true }
    )

    if (error) {
      console.error("[Literature] Save error:", error.message)
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Literature] Save error:", error)
    return NextResponse.json({ error: "Gagal menyimpan literatur" }, { status: 500 })
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
      .from("literatures")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Literature] Delete error:", error)
    return NextResponse.json({ error: "Gagal menghapus literatur" }, { status: 500 })
  }
}
