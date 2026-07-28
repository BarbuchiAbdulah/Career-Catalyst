import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// False until .env.local is filled in — App.tsx checks this before making any
// Supabase calls, so a missing config shows a clear setup screen instead of a
// blank page or a thrown error deep in a network call.
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-anon-key");
