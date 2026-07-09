import Link from "next/link"
import { ArrowRight, BookOpen, Edit3, Brain, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Literatur Explorer",
    description: "Cari + rangkum artikel ilmiah dari CrossRef dengan bantuan AI. Simpan koleksi literatur untuk Bab 2.",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    title: "Writing Assistant",
    description: "Tempel bab skripsimu, AI akan koreksi grammar, rekomendasi kata akademik, dan cek struktur tulisan.",
    icon: Edit3,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title: "Sidang Prep",
    description: "AI generate 10-15 pertanyaan sidang berdasarkan bab yang sudah kamu tulis. Lengkap dengan contoh jawaban.",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    title: "Progress Tracker",
    description: "Pantau progres skripsi per bab. Deadline countdown. Motivasi biar tetap semangat.",
    icon: BarChart3,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
]

const steps = [
  {
    step: "1",
    title: "Login Gratis",
    desc: "Pakai Google atau email. Nggak perlu bayar.",
  },
  {
    step: "2",
    title: "Kerjakan Skripsi",
    desc: "Cari literatur, review bab, latihan sidang — semua di satu tempat.",
  },
  {
    step: "3",
    title: "Selesaikan Tepat Waktu",
    desc: "Pantau progress dan dapat bantuan AI kapan pun.",
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ─── HERO ─── */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="size-6 text-primary" />
          <span>ThesisAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link href="/auth/login">
            <Button>Daftar Gratis</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO SECTION ─── */}
        <section className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            🎓 Gratis untuk mahasiswa Indonesia
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Bantumu Lulus Skripsi
            <span className="text-primary"> Tanpa Pusing</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Literatur Explorer, Writing Assistant, Sidang Prep, dan Progress Tracker.
            Semua gratis. Biar skripsimu selesai — tepat waktu.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2 text-base">
                Mulai Gratis <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="#fitur">
              <Button variant="outline" size="lg" className="text-base">
                Lihat Fitur
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            ✨ Didukung AI multi-provider gratis
          </p>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="fitur" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-2">Semua yang Kamu Butuh untuk Skripsi</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Dari Bab 1 sampai sidang — dibantu AI gratis kapan pun.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm">
                <CardHeader>
                  <div className={`size-12 rounded-xl ${f.bg} flex items-center justify-center mb-2`}>
                    <f.icon className={`size-6 ${f.color}`} />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Cara Kerjanya</h2>
            <p className="text-center text-muted-foreground mb-12">Tiga langkah mudah — nggak pake ribet.</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="size-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Siap Mulai?</h2>
            <p className="text-muted-foreground mb-8">
              Chat GPT atau Claude aja udah bisa buat bantu skripsi? Iya.
              Tapi ThesisAI dirancang khusus untuk kebutuhan akademik mahasiswa Indonesia.
              Literatur terstruktur, review bab sesuai template, dan persiapan sidang yang relevan.
            </p>
            <Link href="/auth/login">
              <Button size="lg" className="gap-2 text-base">
                Mulai Gratis Sekarang <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="size-4" />
            ThesisAI
          </div>
          <div className="flex items-center gap-4">
            <Link href="/kebijakan-privasi" className="hover:text-foreground transition-colors underline underline-offset-2">
              Privasi
            </Link>
            <Link href="/syarat-ketentuan" className="hover:text-foreground transition-colors underline underline-offset-2">
              Syarat & Ketentuan
            </Link>
            <a
              href="https://saweria.co/thesisai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              💝 Donasi
            </a>
          </div>
          <p>© 2026 ThesisAI</p>
        </div>
      </footer>
    </div>
  )
}
