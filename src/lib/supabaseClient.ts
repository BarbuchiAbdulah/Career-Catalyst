import { createClient } from "@supabase/supabase-js";

// Trims whitespace/newlines and strips wrapping quotes — hosting-platform env
// var UIs (Vercel, etc.) commonly end up with one of these by accident, and
// a stray character here breaks fetch() with an opaque "Invalid value" error.
function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^['"]|['"]$/g, "");
}

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// False until .env.local is filled in — App.tsx checks this before making any
// Supabase calls, so a missing config shows a clear setup screen instead of a
// blank page or a thrown error deep in a network call.
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-anon-key");
