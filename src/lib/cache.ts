export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL = 10 * 60 * 1000 // 10 minutos

const cache = new Map<string, CacheEntry<any>>()

export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttl })
}

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value as T
} 