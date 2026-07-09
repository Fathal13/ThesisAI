import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const origin = req.headers.get("origin") ?? ""

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  if (body.action === "signin") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ user: data.user, session: data.session })
  }

  if (body.action === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { nama: body.nama },
      },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      user: data.user,
      message: "Cek email untuk konfirmasi pendaftaran.",
    })
  }

  if (body.action === "signout") {
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
