import { redirect } from "next/navigation";

import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";
import type { SessionPayload, UserRole } from "@/lib/types";

export async function requireSession(role?: UserRole): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (role && session.role !== role) {
    redirect(getDefaultRoute(session.role));
  }

  return session;
}
