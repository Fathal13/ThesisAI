import { NextRequest, NextResponse } from "next/server"

const isDev = process.env.NODE_ENV === "development"

function buildCSP(): string {
  // Base CSP policy
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://vercel.live https://va.vercel-scripts.com https://vercel-insights.com https://*.vercel-insights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https:;
    connect-src 'self' https://*.supabase.co https://*.vercel.app https://*.vercel-analytics.com https://*.vercel-insights.com https://api.allorigins.win https://api.allorigins.win/raw;
    child-src 'self' https://vercel.live;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `

  return csp
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function proxy(request: NextRequest) {
  const cspHeader = buildCSP()

  const requestHeaders = new Headers(request.headers)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set("Content-Security-Policy", cspHeader)
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}

// Matcher: skip API routes, static assets, prefetch requests
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _vercel/insights (Vercel Analytics)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|_vercel/insights).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}