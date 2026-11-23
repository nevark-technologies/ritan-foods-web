import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { mockState, type MockUser } from "@/lib/data/mock";
import type { SessionUser } from "@/lib/data/types";

/**
 * Demo-mode accounts (no Supabase): users live in the in-memory store,
 * passwords are scrypt-hashed, sessions are HMAC-signed cookies.
 */

const COOKIE = "rf_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set");
  return s || "ritan-dev-only-secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

function seedAdmin() {
  const s = mockState();
  const email = process.env.DEMO_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!email || !password || s.users.some((u) => u.email === email)) return;
  s.users.push({ id: "demo-admin", email, name: "Ritan Admin", phone: null, role: "admin", passwordHash: hashPassword(password), createdAt: "2026-11-01T09:00:00.000Z" });
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");
const toSession = (u: MockUser): SessionUser => ({ id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role });

async function setSession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export const mockAuth = {
  async getUser(): Promise<SessionUser | null> {
    seedAdmin();
    const raw = (await cookies()).get(COOKIE)?.value;
    if (!raw) return null;
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [userId, exp, mac] = parts;
    const expected = sign(`${userId}.${exp}`);
    if (expected.length !== mac.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
    if (Number(exp) * 1000 < Date.now()) return null;
    const user = mockState().users.find((u) => u.id === userId);
    return user ? toSession(user) : null;
  },

  async signIn(email: string, password: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
    seedAdmin();
    const user = mockState().users.find((u) => u.email === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false, error: "That email and password don't match." };
    await setSession(user.id);
    return { ok: true, user: toSession(user) };
  },

  async signUp(input: { name: string; email: string; phone: string | null; password: string }): Promise<{ ok: true; user: SessionUser; needsConfirmation: false } | { ok: false; error: string }> {
    seedAdmin();
    const s = mockState();
    const email = input.email.toLowerCase();
    if (s.users.some((u) => u.email === email)) return { ok: false, error: "An account with this email already exists. Try signing in." };
    const user: MockUser = { id: randomUUID(), email, name: input.name, phone: input.phone, role: "customer", passwordHash: hashPassword(input.password), createdAt: new Date().toISOString() };
    s.users.push(user);
    await setSession(user.id);
    return { ok: true, user: toSession(user), needsConfirmation: false };
  },

  async signOut() {
    (await cookies()).delete(COOKIE);
  },

  async updateProfile(userId: string, patch: { name?: string; phone?: string | null }) {
    const u = mockState().users.find((x) => x.id === userId);
    if (u) Object.assign(u, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
  },

  async updatePassword(password: string): Promise<{ ok: boolean; message: string }> {
    const user = await mockAuth.getUser();
    if (!user) return { ok: false, message: "Please sign in again." };
    const u = mockState().users.find((x) => x.id === user.id);
    if (u) u.passwordHash = hashPassword(password);
    return { ok: true, message: "Password updated." };
  },

  async requestPasswordReset(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "Password reset emails are sent once Supabase is connected. In demo mode, create a new account instead." };
  },
};
