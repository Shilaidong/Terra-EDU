import { cookies } from "next/headers";

import { localeCookieName, type Locale } from "@/lib/locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(localeCookieName)?.value;

  return value === "zh" ? "zh" : "en";
}
