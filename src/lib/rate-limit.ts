/**
 * In-memory fixed-window limiter. Enough to stop one client hammering the model
 * routes; a serverless deploy gets one bucket per warm instance, which is the
 * accepted trade for having no external dependency.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const MAX_BUCKETS = 5_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function allowRequest(key: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_PER_WINDOW) return false;
  buckets.set(key, { count: bucket.count + 1, resetAt: bucket.resetAt });
  return true;
}

/** Without this, spoofed client headers would grow the map without bound. */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Trust only what the platform appends. Vercel puts the real client IP in
 * x-real-ip, and appends to x-forwarded-for — so the RIGHTMOST hop is the
 * trustworthy one. Reading the leftmost would let a client spoof a fresh
 * identity per request and bypass the limit entirely.
 */
export function clientKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const hops = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  return hops[hops.length - 1]?.trim() || "anonymous";
}

/** Test seam — the limiter is module state, so suites must be able to reset it. */
export function resetLimiter(): void {
  buckets.clear();
}
