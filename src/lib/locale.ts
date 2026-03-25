export const localeCookieName = "terra_locale";

export type Locale = "zh" | "en";

export function pickText(locale: Locale, english: string, chinese: string) {
  return locale === "zh" ? chinese : english;
}
