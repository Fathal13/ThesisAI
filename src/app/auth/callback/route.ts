import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type") // signup, recovery, etc.
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          },
        },
      }
    )

    // Exchange the auth code for a session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Email confirmed & session set — redirect to dashboard
      return NextResponse.redirect(new URL(next, request.url))
    }

    console.error("[Auth callback] Code exchange error:", error.message)
  }

  // Fallback: redirect to login with success message
  // For recovery flow (reset password), redirect to reset-password page
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/auth/login?reset=true", request.url))
  }

  return NextResponse.redirect(new URL("/auth/login?verified=true", request.url))
}
