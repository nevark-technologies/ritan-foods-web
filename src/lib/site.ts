/** Canonical site URL (set NEXT_PUBLIC_SITE_URL in production). */
export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
