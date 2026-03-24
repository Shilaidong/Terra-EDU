import { cookies } from "next/headers";

import type { SessionPayload } from "@/lib/types";

const COOKIE_NAME = "terra_session";

function toBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64url");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf-8");
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

function encodeSession(session: SessionPayload) {
  return toBase64Url(JSON.stringify(session));
}

function decodeSession(value: string): SessionPayload | null {
  try {
    const json = fromBase64Url(value);
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;

  return raw ? decodeSession(raw) : null;
}

export async function setSession(session: SessionPayload) {
  const jar = await cookies();

  jar.set(COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function parseSessionValue(value?: string) {
  return value ? decodeSession(value) : null;
}
