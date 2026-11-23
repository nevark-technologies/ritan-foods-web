import "server-only";

/**
 * Best-effort fixed-window limiter (per server instance). On serverless it
 * resets with cold starts — fine as a spam brake, not a security boundary.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || hit.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  hit.count += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  return hit.count <= limit;
}
