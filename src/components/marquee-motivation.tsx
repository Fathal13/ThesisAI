"use client"

import { useState, useEffect } from "react"
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
  const [text, setText] = useState(motivations[0])
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % motivations.length
      setText(motivations[i])
    }, 6000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10 rounded-xl py-3">
      <div className="flex items-center gap-3 animate-marquee whitespace-nowrap">
        <Sparkles className="size-5 text-primary flex-shrink-0" />
        <span className="font-medium text-primary text-sm md:text-base">{text}</span>
        <Sparkles className="size-5 text-primary flex-shrink-0" />
        <span className="font-medium text-primary text-sm md:text-base">{text}</span>
        <Sparkles className="size-5 text-primary flex-shrink-0" />
        <span className="font-medium text-primary text-sm md:text-base">{text}</span>
      </div>
    </div>
  )
}
