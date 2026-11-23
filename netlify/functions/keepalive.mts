/**
 * Scheduled (daily, see netlify.toml): one tiny read keeps the free Supabase
 * project active. Uses the public anon key, so it can only read public rows.
 */
export default async function keepalive(): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response("Supabase is not configured; nothing to keep alive.");
  const res = await fetch(`${url}/rest/v1/categories?select=id&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  console.log(`[keepalive] Supabase responded ${res.status}`);
  return new Response(`Supabase responded ${res.status}`, { status: res.ok ? 200 : 502 });
}
