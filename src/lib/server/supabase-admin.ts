import { createClient } from "@supabase/supabase-js";

declare global {
  var __terraSupabaseAdminWarned: boolean | undefined;
}

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    if (!globalThis.__terraSupabaseAdminWarned) {
      globalThis.__terraSupabaseAdminWarned = true;
      console.warn(
        "[terra] Supabase admin client unavailable. Falling back to local/demo data where supported."
      );
    }

    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
