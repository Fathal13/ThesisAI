import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const CSRF_TOKEN_NAME = "csrf_token"
const CSRF_TOKEN_BYTES = 32

function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_BYTES)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function GET() {
  const token = generateCsrfToken()

  const response = NextResponse.json({ token })

  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return response
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const submittedToken = body.csrf_token ?? req.headers.get("x-csrf-token")

  if (!submittedToken) {
    return NextResponse.json({ valid: false, error: "CSRF token missing" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!storedToken || storedToken !== submittedToken) {
    return NextResponse.json({ valid: false, error: "Invalid CSRF token" }, { status: 403 })
  }

  return NextResponse.json({ valid: true })
}