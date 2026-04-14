import type { Metadata } from "next";
import { Literata, Nunito_Sans } from "next/font/google";

import { LocaleProvider } from "@/components/locale-provider";
import { getLocale } from "@/lib/locale-server";

import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "引路人生涯探索系统 | Lodestar Career Exploration System",
  description: "Career exploration system for students, parents, and consultants.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${literata.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
