import "server-only";
import { mockStore } from "./mock";
import type { DataStore } from "./store";
import { supabaseConfigured, supabaseStore } from "./supabase";

/**
 * The one storage entry point. With Supabase keys present the app runs on
 * Postgres; otherwise it falls back to an in-memory demo store so every
 * screen (including checkout and admin) works with zero setup.
 */
export const store: DataStore = supabaseConfigured() ? supabaseStore : mockStore;

export const isDemoMode = store.kind === "mock";

/** Sample reviews and demo orders are only ever shown in demo mode (or when explicitly enabled). */
export const showDemoContent = isDemoMode || process.env.NEXT_PUBLIC_SHOW_DEMO_CONTENT === "true";

export type { DataStore } from "./store";
