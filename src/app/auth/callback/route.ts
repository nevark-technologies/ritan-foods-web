import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/data/supabase";
import { supabaseForRequest } from "@/lib/supabase/server";

/** Supabase email links (confirm signup, reset password) land here to exchange the code for a session. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/account";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";
  if (code && supabaseConfigured()) {
    const sb = await supabaseForRequest();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/account?error=link", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
