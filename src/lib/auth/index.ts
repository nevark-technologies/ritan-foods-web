import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseConfigured } from "@/lib/data/supabase";
import type { SessionUser } from "@/lib/data/types";
import { mockAuth } from "./mock";
import { supabaseAuth } from "./supabase";

/** One auth surface for the app; picks Supabase Auth when configured. */
export const auth = supabaseConfigured() ? supabaseAuth : mockAuth;

/** Session reads are request-time only (they check expiry against the clock). */
export async function getSessionUser(): Promise<SessionUser | null> {
  await connection();
  return auth.getUser();
}

export async function requireUser(next = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/account?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/account?next=/admin");
  if (user.role !== "admin") redirect("/account?denied=1");
  return user;
}
