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
      .from("literatures")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Collection] Fetch error:", error.message)
      return NextResponse.json({ error: "Gagal mengambil koleksi" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("[Collection] Error:", error)
    return NextResponse.json({ error: "Gagal mengambil koleksi" }, { status: 500 })
  }
}
