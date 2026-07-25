/**
 * Small TTL cache for generated content that does not vary per moment.
 *
 * A lesson on "why relapse is not failure" for an alcohol profile a week in is
 * the same lesson every time it is asked for. Regenerating it burns latency, a
 * paid call, and — on the free tier — a slice of a daily quota measured in tens
 * of requests. Caching those routes makes repeat views instant and free.
 *
 * Explicitly NOT used for anything reflecting a person's live state: SOS scripts
 * and check-in analyses must always be generated fresh.
 */
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 200;

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

export function cacheKey(parts: readonly (string | number)[]): string {
  return parts.map((part) => String(part).toLowerCase().trim()).join("|");
}

export function readCache<T>(key: string, now: number = Date.now()): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (now >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  // Refresh recency so the eviction below drops genuinely cold entries.
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

export function writeCache<T>(
  key: string,
  value: T,
  now: number = Date.now(),
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (!oldest.done) store.delete(oldest.value);
  }
  store.set(key, { value, expiresAt: now + ttlMs });
}

/** Fetches through the cache, only paying for a generation on a miss. */
export async function withCache<T>(
  key: string,
  produce: () => Promise<T>,
): Promise<T> {
  const hit = readCache<T>(key);
  if (hit !== null) return hit;
  const value = await produce();
  writeCache(key, value);
  return value;
}

export function clearCache(): void {
  store.clear();
}

export function cacheSize(): number {
  return store.size;
}
