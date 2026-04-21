import { cookies } from "next/headers";

import type { SessionPayload } from "@/lib/types";

const COOKIE_NAME = "terra_session";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64url");
  }

  return bytesToBase64Url(new TextEncoder().encode(value));
}

function fromBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf-8");
  }

  return new TextDecoder().decode(base64UrlToBytes(value));
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
    secure: process.env.NODE_ENV === "production",
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
