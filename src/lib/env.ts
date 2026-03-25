const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
] as const;

export type EnvKey = (typeof requiredKeys)[number];

export function getEnvSummary() {
  return {
    authMode: process.env.TERRA_AUTH_MODE ?? "auto",
    aiProvider:
      process.env.TERRA_AI_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? "minimax_anthropic" : "mock"),
    aiReady: Boolean(process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY),
    aiModel: process.env.TERRA_AI_MODEL ?? "MiniMax-M2.7",
    supabaseClientReady: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    supabaseAdminReady: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    sentryReady: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    sentryReleaseReady: Boolean(
      process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_AUTH_TOKEN
    ),
  };
}

export function getMissingProductionEnv() {
  return requiredKeys.filter((key) => !process.env[key]);
}
