"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

/**
 * Hook untuk animasi scroll menggunakan IntersectionObserver.
 * Lightweight, no dependencies, SSR-safe.
 * Trigger sekali saat elemen masuk viewport, lalu unobserve.
 */
export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
        ...options,
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.threshold, options.rootMargin])

  return [ref, isVisible]
}
