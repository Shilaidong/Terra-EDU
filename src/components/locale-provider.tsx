"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { localeCookieName } from "@/lib/locale";
import { cn } from "@/lib/utils";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useText() {
  const locale = useLocale();
  return (english: string, chinese: string) => (locale === "zh" ? chinese : english);
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className={cn("inline-flex items-center rounded-full border border-outline-variant bg-white p-1 shadow-sm", className)}>
      {([
        { value: "zh", label: "中文" },
        { value: "en", label: "EN" },
      ] as const).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            document.cookie = `${localeCookieName}=${option.value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
            router.refresh();
          }}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            locale === option.value
              ? "bg-primary text-white"
              : "text-secondary hover:text-primary"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
