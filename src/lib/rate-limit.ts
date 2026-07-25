/**
 * In-memory fixed-window limiter. Enough to stop a single client hammering the
 * model routes; a serverless deploy gets one bucket per warm instance, which is
 * the accepted trade for having no external dependency.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function allowRequest(key: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_PER_WINDOW) return false;
  buckets.set(key, { count: bucket.count + 1, resetAt: bucket.resetAt });
  return true;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

/** Test seam — the limiter is module state, so suites must be able to reset it. */
export function resetLimiter(): void {
  buckets.clear();
}
