import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getDefaultRoute } from "@/lib/routes";
import { parseSessionValue } from "@/lib/session";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const protectedPrefixes = ["/student", "/parent", "/consultant", "/admin"];

export function proxy(request: NextRequest) {
  return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = await updateSupabaseSession(request);

  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return supabaseResponse;
  }

  const session = parseSessionValue(request.cookies.get("terra_session")?.value);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/student") && session.role !== "student") {
    return NextResponse.redirect(new URL(getDefaultRoute(session.role), request.url));
  }

  if (pathname.startsWith("/parent") && session.role !== "parent") {
    return NextResponse.redirect(new URL(getDefaultRoute(session.role), request.url));
  }

  if (pathname.startsWith("/consultant") && session.role !== "consultant") {
    return NextResponse.redirect(new URL(getDefaultRoute(session.role), request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(getDefaultRoute(session.role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/student/:path*", "/parent/:path*", "/consultant/:path*", "/admin/:path*"],
};
