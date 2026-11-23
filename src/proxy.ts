import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Keeps Supabase Auth sessions fresh: server components can read cookies but
 * not write them, so expiring tokens are refreshed here before rendering.
 * Visitors without a session cookie (and demo mode) pass straight through.
 */
export async function proxy(request: NextRequest) {
  if (!url || !anonKey) return NextResponse.next();
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|textures/|api/webhooks/|favicon\\.ico|icon\\.svg|apple-icon\\.png|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|woff2?)$).*)"],
};
