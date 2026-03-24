import { createClient } from "@supabase/supabase-js";
import { getPublicAuthMode } from "@/lib/supabase/shared";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || getPublicAuthMode() === "demo") {
    return null;
  }

  return createClient(url, key);
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      getPublicAuthMode() !== "demo"
  );
}
