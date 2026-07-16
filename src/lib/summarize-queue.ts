"use client"

/**
 * Client-side queue untuk request yang di-rate limit.
 * Memproses 1 item per waktu + delay minimum antar operasi.
 */

export type QueueItemStatus = "pending" | "processing" | "completed" | "failed"

export interface QueueItemMeta {
  id: string
  label: string
  status: QueueItemStatus
  position: number
}

type Listener = () => void

export function createQueue() {
  let idCounter = 0
  const pending: Array<{ id: string; label: string; run: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: Error) => void }> = []
  let processing = false
  let lastRun = 0
  const MIN_DELAY = 1200 // ms — lebih dari 1 detik untuk aman dari rate limit
  const listeners = new Set<Listener>()

  function notify() {
    listeners.forEach((fn) => fn())
  }

  function getSnapshot(): QueueItemMeta[] {
    return [
      ...pending.filter((p) => p).map((p, i) => ({
        id: p.id,
        label: p.label,
        status: "pending" as const,
        position: i + 1,
      })),
    ]
  }

  function subscribe(fn: Listener) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }

  async function processNext() {
    if (processing || pending.length === 0) return
    processing = true

    const now = Date.now()
    const elapsed = now - lastRun
    if (elapsed < MIN_DELAY) {
      await new Promise((r) => setTimeout(r, MIN_DELAY - elapsed))
    }

    const item = pending.shift()
    if (!item) {
      processing = false
      return
    }

    try {
      const result = await item.run()
      item.resolve(result)
    } catch (e) {
      item.reject(e instanceof Error ? e : new Error(String(e)))
    } finally {
      lastRun = Date.now()
      processing = false
      notify()
      processNext()
    }
  }

  function enqueue(label: string, run: () => Promise<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = `q-${++idCounter}`
      pending.push({ id, label, run, resolve, reject })
      notify()
      processNext()
    })
  }

  function getPendingCount() {
    return pending.length
  }

  function isProcessing() {
    return processing
  }

  return { enqueue, getSnapshot, subscribe, getPendingCount, isProcessing }
}

/**
 * Singleton queue — semua module pakai instance yang sama.
 * Jadi request summarize dari tab Cari dan tab Koleksi diantre bareng.
 */
export const summarizeQueue = createQueue()
