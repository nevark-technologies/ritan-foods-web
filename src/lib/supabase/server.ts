import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cookie-bound client: acts as the signed-in user (RLS applies). Request-time only. */
export async function supabaseForRequest() {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component - the proxy refreshes the session instead.
        }
      },
    },
  });
}

const stateless = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Anonymous client for public reads (RLS applies; safe inside "use cache"). */
export function supabasePublic() {
  return (publicClient ??= createClient(url(), anon(), stateless));
}

/** Service-role client: bypasses RLS. Server-only, for orders, stock and admin. */
export function supabaseAdmin() {
  return (adminClient ??= createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, stateless));
}
