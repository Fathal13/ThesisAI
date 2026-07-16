"use client"

/**
 * Simple async queue for rate-limited operations.
 * Processes items sequentially with configurable concurrency.
 */

export interface QueueItem<T> {
  id: string
  payload: T
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  status: "pending" | "processing" | "completed" | "failed"
  startedAt?: number
  completedAt?: number
  error?: string
}

export interface QueueOptions<T> {
  /** Maximum concurrent operations (default: 1) */
  concurrency?: number
  /** Minimum delay between operations in ms (default: 1000) */
  minDelay?: number
  /** Optional callback when item starts processing */
  onStart?: (item: QueueItem<T>) => void
  /** Optional callback when item completes */
  onComplete?: (item: QueueItem<T>, result: unknown) => void
  /** Optional callback when item fails */
  onError?: (item: QueueItem<T>, error: Error) => void
}

/**
 * Creates a queue processor for rate-limited operations.
 * Useful for AI API calls that have strict rate limits (e.g., Gemini 60 RPM).
 */
export function createQueue<T>(options: QueueOptions<T> = {}) {
  const {
    concurrency = 1,
    minDelay = 1000,
    onStart,
    onComplete,
    onError,
  } = options

  const queue: QueueItem<T>[] = []
  let activeCount = 0
  let lastProcessedAt = 0

  function process() {
    // Check if we can process more
    if (activeCount >= concurrency) return
    if (queue.length === 0) return

    // Find next pending item
    const item = queue.find((q) => q.status === "pending")
    if (!item) return

    item.status = "processing"
    item.startedAt = Date.now()
    activeCount++
    onStart?.(item)

    // Enforce minimum delay between operations
    const now = Date.now()
    const timeSinceLast = now - lastProcessedAt
    const delay = timeSinceLast < minDelay ? minDelay - timeSinceLast : 0

    setTimeout(() => {
      lastProcessedAt = Date.now()
      processItem(item)
    }, delay)
  }

  async function processItem(item: QueueItem<T>) {
    try {
      // The actual processing logic will be provided when enqueueing
      // We just wait for the promise to resolve
      await item.resolve(undefined)
      item.status = "completed"
      item.completedAt = Date.now()
      onComplete?.(item, undefined)
    } catch (error) {
      item.status = "failed"
      item.completedAt = Date.now()
      item.error = error instanceof Error ? error.message : String(error)
      onError?.(item, error instanceof Error ? error : new Error(String(error)))
    } finally {
      activeCount--
      // Process next item
      process()
    }
  }

  /**
   * Add item to queue and return promise that resolves when processed.
   * The processor function is called when the item reaches the front of the queue.
   */
  function enqueue(payload: T, processor: (payload: T) => Promise<unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const item: QueueItem<T> = {
        id: crypto.randomUUID(),
        payload,
        resolve: async () => {
          try {
            const result = await processor(payload)
            resolve(result)
          } catch (e) {
            reject(e)
          }
        },
        reject,
        status: "pending",
      }
      queue.push(item)
      process()
    })
  }

  function getQueueSnapshot() {
    return [...queue].map((item) => ({
      id: item.id,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      error: item.error,
    }))
  }

  function clear() {
    // Reject all pending items
    for (const item of queue) {
      if (item.status === "pending") {
        item.status = "failed"
        item.error = "Queue cleared"
        item.reject(new Error("Queue cleared"))
      }
    }
    queue.length = 0
    activeCount = 0
  }

  function getPendingCount() {
    return queue.filter((q) => q.status === "pending").length
  }

  function getProcessingCount() {
    return queue.filter((q) => q.status === "processing").length
  }

  return {
    enqueue,
    getQueueSnapshot,
    clear,
    getPendingCount,
    getProcessingCount,
  }
}

/**
 * Hook-friendly queue state for React components.
 * Provides reactive state updates for queue progress display.
 */
export function createQueueWithState<T>(options: QueueOptions<T> = {}) {
  const queue = createQueue<T>(options)

  return queue
}