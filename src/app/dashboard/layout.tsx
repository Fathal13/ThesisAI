import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null

  try {
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

    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Not authenticated — will be handled by middleware
  }

  if (!user) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <BookOpen className="size-12 text-primary" />
        <h1 className="text-2xl font-bold">Sesi berakhir</h1>
        <p className="text-muted-foreground">Silakan login kembali untuk melanjutkan.</p>
        <Link href="/auth/login">
          <Button>Masuk Kembali</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <DashboardSidebar user={user} />
      <main className="transition-all duration-200 pl-64">
        <div className="container mx-auto p-6 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
