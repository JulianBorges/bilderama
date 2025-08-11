const tokenBuckets = new Map<string, { tokens: number; last: number }>()

export function rateLimit(key: string, capacity = 10, refillPerSec = 5): boolean {
  const now = Date.now()
  const entry = tokenBuckets.get(key) || { tokens: capacity, last: now }
  // Refill
  const deltaSec = Math.max(0, (now - entry.last) / 1000)
  const refill = deltaSec * refillPerSec
  entry.tokens = Math.min(capacity, entry.tokens + refill)
  entry.last = now
  if (entry.tokens < 1) {
    tokenBuckets.set(key, entry)
    return false
  }
  entry.tokens -= 1
  tokenBuckets.set(key, entry)
  return true
} 