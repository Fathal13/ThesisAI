"use client"

import { Sparkles } from "lucide-react"

const motivations = [
  "Kamu lebih dekat dengan gelar S.Kom setiap menit mengetik 🎓",
  "Progress 1% hari ini > 0% kemarin. Gas!",
  "Bab 2 selesai = fondasi kuat untuk Bab 3-5 💪",
  "Dosen pembimbing suka mahasiswa yang proaktif review sendiri 📝",
  "Latihan sidang 10 menit sehari > marathon semalaman 🎯",
  "Setiap paragraf yang kau tulis = satu langkah ke wisuda 🚀",
  "Kamu nggak sendirian. Ribuan mahasiswa lewat sini juga 💙",
  "Error AI cuma jeda, bukan akhir. Coba lagi sebentar ⏳",
]

export function MarqueeMotivation() {
  const items = motivations.flatMap((m, i) => [
    <Sparkles key={`s${i}`} className="size-5 text-primary flex-shrink-0 mx-3" />,
    <span key={`t${i}`} className="font-medium text-primary text-sm md:text-base whitespace-nowrap">{m}</span>,
  ])

  return (
    <div className="overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10 rounded-xl py-3">
      <div className="flex items-center animate-marquee w-max">
        {items}{items}
      </div>
    </div>
  )
}
