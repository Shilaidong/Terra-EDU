import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

declare global {
  var __terraSupabaseServerWarned: boolean | undefined;
}

export async function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!globalThis.__terraSupabaseServerWarned) {
      globalThis.__terraSupabaseServerWarned = true;
      console.warn(
        "[terra] Supabase server client unavailable. Auth/session refresh will stay in local fallback mode."
      );
    }

    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}
