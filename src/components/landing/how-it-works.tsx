"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { useEffect, useState } from "react"

/**
 * Data langkah — lebih konkret, dengan icon lucide.
 */
const STEPS = [
  {
    number: "01",
    title: "Daftar Gratis",
    subtitle: "Bikin akun dalam 1 menit",
    desc: "Google OAuth atau email. Nggak perlu kartu kredit — serius, gratis selamanya.",
    icon: "🎓",
    accent: "from-blue-500/20 to-blue-600/5",
    // Menggunakan emoji karena lebih "hangat" dan nggak terlihat AI-generated
  },
  {
    number: "02",
    title: "Cari & Kumpulin Literatur",
    subtitle: "250+ juta artikel Open Access",
    desc: "Temukan jurnal ilmiah relevan, rangkum otomatis dengan AI, simpan ke koleksi, dan jadikan draft Bab 2.",
    icon: "📚",
    accent: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    number: "03",
    title: "Review Bab & Latihan Sidang",
    subtitle: "Dibantu AI, bukan digantiin AI",
    desc: "Review grammar, struktur, dan formalitas. Generate pertanyaan sidang + simulasi jawaban. Progress terpantau.",
    icon: "✍️",
    accent: "from-purple-500/20 to-purple-600/5",
  },
  {
    number: "04",
    title: "Selesai Tepat Waktu",
    subtitle: "Pantau progress harian",
    desc: "Deadline countdown, timeline otomatis, dan quote motivasi. Skripsi kelar — wisuda nggak molor.",
    icon: "🎯",
    accent: "from-orange-500/20 to-orange-600/5",
  },
]

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[0]
  index: number
}) {
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>()
  const [iconLoaded, setIconLoaded] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Stagger: tunda animasi ikon biar kece
      const timer = setTimeout(() => setIconLoaded(true), 300 + index * 100)
      return () => clearTimeout(timer)
    }
  }, [isVisible, index])

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-800 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDuration: "700ms", transitionDelay: `${index * 150}ms` }}
    >
      {/* Garis penghubung antar langkah (desktop only) */}
      {index < STEPS.length - 1 && (
        <div className="hidden lg:block absolute left-8 top-20 w-px h-[calc(100%+2rem)] bg-gradient-to-b from-primary/20 to-transparent" />
      )}

      <div className="flex gap-5 p-6 rounded-2xl border bg-card hover:bg-accent/30 transition-colors group">
        {/* Icon dengan progress ring */}
        <div className="relative shrink-0">
          <div
            className={`size-16 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-3xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-md ${
              iconLoaded ? "scale-100" : "scale-75 opacity-0"
            }`}
          >
            <span className="drop-shadow-sm">{step.icon}</span>
          </div>
          {/* Nomor langkah overlay kecil */}
          <div className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold flex items-center justify-center shadow-sm">
            {step.number}
          </div>
        </div>

        {/* Konten */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{step.title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{step.subtitle}</p>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">{step.desc}</p>
        </div>
      </div>
    </div>
  )
}

export function HowItWorks() {
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>()

  return (
    <section className="relative overflow-hidden py-24">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ease-out ${
            titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Cara Kerja
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Dari Nol Sampai Lulus
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Bukan joki — cuma alat bantu biar skripsimu selesai lebih efisien.
            Langkahnya sederhana, hasilnya maksimal.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* Bottom accent */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60">
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            100% gratis · AI multi-provider · Akses 250+ juta jurnal
            <span className="size-1 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
      </div>
    </section>
  )
}
