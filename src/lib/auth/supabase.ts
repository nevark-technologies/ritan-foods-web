import "server-only";
import type { Role, SessionUser } from "@/lib/data/types";
import { siteUrl } from "@/lib/site";
import { supabaseAdmin, supabaseForRequest } from "@/lib/supabase/server";

/** Supabase Auth (email + password, magic link, password reset). */
export const supabaseAuth = {
  async getUser(): Promise<SessionUser | null> {
    const sb = await supabaseForRequest();
    const { data } = await sb.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const { data: profile } = await sb.from("profiles").select("full_name, phone, role").eq("id", u.id).maybeSingle();
    return {
      id: u.id,
      email: u.email ?? "",
      name: profile?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? u.email?.split("@")[0] ?? "",
      phone: profile?.phone ?? null,
      role: ((profile?.role as Role) ?? "customer") as Role,
    };
  },

  async signIn(email: string, password: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
    const sb = await supabaseForRequest();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message.includes("confirm") ? "Please confirm your email first - check your inbox." : "That email and password don't match." };
    const user = await supabaseAuth.getUser();
    return user ? { ok: true, user } : { ok: false, error: "Signed in, but your profile couldn't be loaded." };
  },

  async signUp(input: { name: string; email: string; phone: string | null; password: string }): Promise<{ ok: true; user: SessionUser | null; needsConfirmation: boolean } | { ok: false; error: string }> {
    const sb = await supabaseForRequest();
    const { data, error } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name, phone: input.phone }, emailRedirectTo: `${siteUrl()}/auth/callback?next=/account` },
    });
    if (error) return { ok: false, error: error.message };
    const needsConfirmation = !data.session;
    return { ok: true, user: needsConfirmation ? null : await supabaseAuth.getUser(), needsConfirmation };
  },

  async signOut() {
    const sb = await supabaseForRequest();
    await sb.auth.signOut();
  },

  async updateProfile(userId: string, patch: { name?: string; phone?: string | null }) {
    await supabaseAdmin()
      .from("profiles")
      .update({ ...(patch.name !== undefined ? { full_name: patch.name } : {}), ...(patch.phone !== undefined ? { phone: patch.phone } : {}) })
      .eq("id", userId);
  },

  async updatePassword(password: string): Promise<{ ok: boolean; message: string }> {
    const sb = await supabaseForRequest();
    const { error } = await sb.auth.updateUser({ password });
    return error ? { ok: false, message: error.message } : { ok: true, message: "Password updated." };
  },

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    const sb = await supabaseForRequest();
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/account/reset` });
    return error ? { ok: false, message: error.message } : { ok: true, message: "If an account exists for that email, a reset link is on its way." };
  },
};
