import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Link from "next/link"
import { BookOpen, Edit3, Brain, BarChart3, ArrowRight } from "lucide-react"
import { MarqueeMotivation } from "@/components/marquee-motivation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const quickActions = [
  {
    title: "Cari Literatur",
    desc: "Temukan artikel ilmiah untuk Bab 2",
    href: "/dashboard/literature",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    title: "Review Bab",
    desc: "Koreksi tulisan dengan AI",
    href: "/dashboard/writing",
    icon: Edit3,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title: "Latihan Sidang",
    desc: "Generate pertanyaan sidang",
    href: "/dashboard/sidang",
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    title: "Progress",
    desc: "Pantau perkembangan skripsi",
    href: "/dashboard/progress",
    icon: BarChart3,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
]

export default async function DashboardPage() {
  let nama = "Mahasiswa"
  let progress = { bab_selesai: 0, total_bab: 5 }
  let judulSkripsi = null

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

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama, jurusan, universitas")
        .eq("id", user.id)
        .single()

      if (profile) nama = profile.nama ?? nama

      const { data: prog } = await supabase
        .from("progress")
        .select("bab_selesai, total_bab, judul_skripsi")
        .eq("user_id", user.id)
        .single()

      if (prog) {
        progress = { bab_selesai: prog.bab_selesai, total_bab: prog.total_bab }
        judulSkripsi = prog.judul_skripsi
      }
    }
  } catch {
    // Fallback — middleware will handle auth later
  }

  const pct = progress.total_bab > 0 ? Math.round((progress.bab_selesai / progress.total_bab) * 100) : 0

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Halo, {nama}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {judulSkripsi
            ? `Lanjutkan skripsimu: "${judulSkripsi}"`
            : "Apa yang ingin kamu kerjakan hari ini?"}
        </p>
      </div>

      {/* Progress Ringkasan */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Progress Skripsi</p>
              <p className="text-2xl font-bold">
                {progress.bab_selesai}/{progress.total_bab} Bab selesai
              </p>
              <p className="text-sm text-muted-foreground">{pct}% menuju sidang 🎯</p>
            </div>
            <div className="w-full md:w-64 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% skripsi selesai`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marquee Motivasi */}
      <MarqueeMotivation />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="h-full border hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div
                    className={cn(
                      "size-12 rounded-xl flex items-center justify-center mb-2",
                      action.bg
                    )}
                  >
                    <action.icon className={cn("size-6", action.color)} />
                  </div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {action.title}
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{action.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
