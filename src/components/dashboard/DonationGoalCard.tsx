"use client"

import { useEffect, useState } from "react"
import { Heart, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DonationGoal {
  target_amount_idr: number
  current_amount_idr: number
  progress_percent: number
  remaining_amount_idr: number
}

export function DonationGoalCard({ className = "", showGoal = true, compact = false }) {
  const [goal, setGoal] = useState<DonationGoal>({
    target_amount_idr: 5000000,
    current_amount_idr: 0,
    progress_percent: 0,
    remaining_amount_idr: 5000000,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGoal() {
      try {
        const res = await fetch("/api/donations/stats", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setGoal(data)
        }
      } catch (error) {
        console.error("[DonationGoalCard] Fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchGoal()
  }, [])

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  if (compact) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="size-4 text-pink-500" />
              <span>Target: {formatRupiah(goal.target_amount_idr)}</span>
            </div>
            {!loading && goal.progress_percent > 0 && (
              <span className="text-sm font-semibold text-primary">
                {goal.progress_percent}%
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loading ? 0 : goal.progress_percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Terkumpul: {formatRupiah(goal.current_amount_idr)}</span>
            <span>Sisa: {formatRupiah(goal.remaining_amount_idr)}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="size-5 text-pink-500" />
          <CardTitle className="text-lg">Dukung ThesisAI Tetap Gratis</CardTitle>
        </div>
        <CardDescription>
          ThesisAI 100% gratis untuk mahasiswa. Donasi sukarela membantu biaya server & API AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGoal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target Bulanan</span>
              <span className="font-semibold">{formatRupiah(goal.target_amount_idr)}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loading ? 0 : goal.progress_percent}%` }}
            />
          </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Terkumpul: <strong>{formatRupiah(goal.current_amount_idr)}</strong></span>
              <span>Sisa: {formatRupiah(goal.remaining_amount_idr)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://saweria.co/fathal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4" />
            Saweria
          </a>
          <a
            href="https://ko-fi.com/fathal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4" />
            Ko-fi
          </a>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Donasi tidak memberikan hak istimewa. Semua fitur tetap gratis untuk semua mahasiswa. 💝
        </p>
      </CardContent>
    </Card>
  )
}