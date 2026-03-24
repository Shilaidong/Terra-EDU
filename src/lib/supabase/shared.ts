export function getPublicAuthMode() {
  const value =
    process.env.NEXT_PUBLIC_TERRA_AUTH_MODE ||
    process.env.TERRA_AUTH_MODE ||
    "auto";

  if (value === "demo" || value === "supabase") {
    return value;
  }

  return "auto";
}

export function shouldUseBrowserSupabaseAuth() {
  return (
    getPublicAuthMode() !== "demo" &&
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
}
