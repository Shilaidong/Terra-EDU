import { redirect } from "next/navigation";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-provider";
import { LoginForm } from "@/components/client-tools";
import { getDemoAccounts } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const locale = await getLocale();
  const session = await getSession();

  if (session) {
    redirect(getDefaultRoute(session.role));
  }

  const accounts = getDemoAccounts();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-terra md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-12 text-white md:flex">
          <div>
            <h1 className="font-serif text-4xl font-bold">Terra Edu</h1>
            <p className="mt-4 max-w-sm text-lg leading-8 text-white/80">
              {pickText(locale, "Your organic path to global education excellence.", "通往全球教育卓越的自然成长路径。")}
            </p>
          </div>
          <blockquote className="border-l-2 border-white/30 pl-4 italic text-white/75">
            {pickText(locale, "Rooted in tradition, branching out to the world.", "扎根于积累，向世界生长。")}
          </blockquote>
        </section>

        <section className="bg-white p-8 sm:p-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">{pickText(locale, "Welcome Back", "欢迎回来")}</h2>
              <p className="mt-2 text-secondary">{pickText(locale, "Sign in with the launch demo accounts or wire Supabase credentials later.", "你可以先使用演示账号登录，后续再接入 Supabase 正式凭据。")}</p>
            </div>
            <LocaleSwitcher />
          </div>

          <LoginForm />

          <div className="mt-8 rounded-3xl bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Demo accounts", "演示账号")}</p>
            <div className="mt-4 space-y-3 text-sm text-secondary">
              {accounts.map((account) => (
                <div key={account.role} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="font-semibold capitalize text-foreground">
                    {account.role === "student"
                      ? pickText(locale, "student", "学生")
                      : account.role === "parent"
                        ? pickText(locale, "parent", "家长")
                        : pickText(locale, "consultant", "顾问")}
                  </p>
                  <p>{account.email}</p>
                  <p>{account.password}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "First login", "首次登录")}</p>
              <p className="mt-2 text-sm text-secondary">
                {pickText(locale, "Grade, target countries, dream schools, and intended major are editable after login.", "登录后可以修改年级、目标国家、梦校和意向专业。")}
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Debug ready", "便于调试")}</p>
              <p className="mt-2 text-sm text-secondary">
                {pickText(locale, "Auth routes emit structured responses and can later switch to Supabase without changing page layout.", "认证接口会返回结构化响应，后续接入 Supabase 也不需要重做页面布局。")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary">
            <Link href="/privacy" className="hover:text-primary">
              {pickText(locale, "Privacy Policy", "隐私政策")}
            </Link>
            <Link href="/terms" className="hover:text-primary">
              {pickText(locale, "Terms of Service", "服务条款")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
