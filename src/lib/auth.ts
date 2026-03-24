import { getUserByCredentials, getUserRecordByEmail } from "@/lib/data";
import { getEnvSummary } from "@/lib/env";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { SessionPayload, UserRole } from "@/lib/types";

export interface AuthSuccess {
  session: SessionPayload;
}

export interface AuthFailure {
  error: string;
  code: "INVALID_CREDENTIALS" | "AUTH_CONFIG_MISSING" | "ROLE_MISMATCH";
}

export async function authenticateUser(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthSuccess | AuthFailure> {
  const authMode = getAuthMode();

  if (authMode === "supabase") {
    return authenticateWithSupabase(input);
  }

  if (authMode === "auto") {
    const env = getEnvSummary();

    if (env.supabaseClientReady && env.supabaseAdminReady) {
      const result = await authenticateWithSupabase(input);
      if ("session" in result) {
        return result;
      }
    }
  }

  return authenticateWithDemo(input);
}

export function getAuthMode() {
  const raw = process.env.TERRA_AUTH_MODE?.toLowerCase();

  if (raw === "demo" || raw === "supabase") {
    return raw;
  }

  return "auto";
}

function authenticateWithDemo(input: {
  email: string;
  password: string;
  role: UserRole;
}): AuthSuccess | AuthFailure {
  const user = getUserByCredentials(input.email, input.password, input.role);

  if (!user) {
    return {
      error: "Email, password, or role is incorrect.",
      code: "INVALID_CREDENTIALS",
    };
  }

  return {
    session: {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      authSource: "demo",
    },
  };
}

async function authenticateWithSupabase(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthSuccess | AuthFailure> {
  const serverSupabase = await getServerSupabaseClient();

  if (!serverSupabase) {
    return {
      error: "Supabase auth is not configured yet.",
      code: "AUTH_CONFIG_MISSING",
    };
  }

  const {
    data: { user },
    error,
  } = await serverSupabase.auth.getUser();

  if (error || !user || user.email !== input.email) {
    return {
      error: "Supabase login session was not found. Please try again.",
      code: "INVALID_CREDENTIALS",
    };
  }

  const appUser = await getUserRecordByEmail(input.email);

  if (!appUser || appUser.role !== input.role) {
    return {
      error: "The selected role does not match this account.",
      code: "ROLE_MISMATCH",
    };
  }

  return {
    session: {
      userId: appUser.id,
      role: appUser.role,
      name: appUser.name,
      email: appUser.email,
      authSource: "supabase",
      authUserId: user.id,
    },
  };
}
