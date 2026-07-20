"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import type { ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number // delay in ms (0, 150, 300, 450)
}

/**
 * Wrapper component — memberi efek fade-in + slide-up saat scroll masuk viewport.
 * Ringan, pakai IntersectionObserver, hanya trigger sekali.
 */
export function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>()

  const delayClass =
    delay === 0 ? "" : `delay-${delay}`

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } ${delayClass} ${className}`}
    >
      {children}
    </div>
  )
}
