import Link from "next/link";
import { redirect } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-provider";
import { getDemoAccounts } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";

export default async function RegisterPage() {
  const locale = await getLocale();
  const session = await getSession();

  if (session) {
    redirect(getDefaultRoute(session.role));
  }

  const accounts = getDemoAccounts().filter((account) => account.role === "student" || account.role === "consultant");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-terra md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-12 text-white md:flex">
          <div>
            <h1 className="font-serif text-4xl font-bold">{pickText(locale, "Lodestar Pathways", "引路人生涯")}</h1>
            <p className="mt-4 max-w-sm text-lg leading-8 text-white/80">
              {pickText(
                locale,
                "Access opening is handled through guided onboarding so the account, planning depth, and collaboration design stay aligned.",
                "平台开通采用引导式方案设计，确保账号、规划深度和协作方式真正匹配。"
              )}
            </p>
          </div>
          <blockquote className="border-l-2 border-white/30 pl-4 italic text-white/75">
            {pickText(locale, "Thoughtful setup first, deeper collaboration after.", "先确定方案，再进入更深的协作。")}
          </blockquote>
        </section>

        <section className="bg-white p-8 sm:p-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">{pickText(locale, "Access Plans", "开通方案")}</h2>
              <p className="mt-2 text-secondary">
                {pickText(
                  locale,
                  "Registration is currently opened through guided consultation. Please contact Teacher Shi for the detailed plan.",
                  "当前注册通过咨询开通，请联系史老师了解具体方案。"
                )}
              </p>
            </div>
            <LocaleSwitcher />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-surface-container-low p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Student access", "学生端方案")}</p>
              <p className="mt-3 font-serif text-4xl font-bold text-foreground">?99</p>
              <p className="mt-3 text-sm leading-7 text-secondary">
                {pickText(
                  locale,
                  "Includes student-facing planning, document workspace, AI guidance, and parent-consultant collaboration visibility.",
                  "包含学生端规划、材料中心、AI 助手，以及与家长和顾问协作相关的完整体验。"
                )}
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-low p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Consultant access", "顾问端方案")}</p>
              <p className="mt-3 font-serif text-4xl font-bold text-foreground">?9999</p>
              <p className="mt-3 text-sm leading-7 text-secondary">
                {pickText(
                  locale,
                  "Includes multi-student workspace, planning book maintenance, content operations, AI reporting, and long-range collaboration tooling.",
                  "包含多学生工作台、规划书维护、内容管理、AI 周报以及长期协作所需的完整顾问能力。"
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-surface-container-high p-5 text-sm text-secondary">
            <p className="font-semibold text-foreground">{pickText(locale, "Contact for full proposal", "具体方案请联系")}</p>
            <p className="mt-2">
              {pickText(locale, "Teacher Shi · WeChat: shilaidong", "史老师 · 微信号：shilaidong")}
            </p>
          </div>

          <div className="mt-6 rounded-3xl bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Experience the platform first", "先体验平台")}</p>
            <div className="mt-4 grid gap-3">
              {accounts.map((account) => (
                <div key={account.role} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <p className="font-semibold text-foreground">
                    {account.role === "student" ? pickText(locale, "Sample student account", "示例学生账号") : pickText(locale, "Sample consultant account", "示例顾问账号")}
                  </p>
                  <p className="mt-1 text-sm text-secondary">{account.email}</p>
                  <p className="text-sm text-secondary">{account.password}</p>
                  <p className="mt-2 text-xs leading-6 text-secondary">
                    {account.role === "student"
                      ? pickText(
                          locale,
                          "Recommended if you want to see the timeline, documents, AI guidance, and weekly execution from the student side.",
                          "推荐先看时间线、材料中心、AI 助手和每周执行在学生端如何联动。"
                        )
                      : pickText(
                          locale,
                          "Recommended if you want to see the student workspace, planning book, AI reports, and consultant-side coordination tools.",
                          "推荐先看学生工作台、规划书、AI 周报和顾问端协同工具的完整形态。"
                        )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary">
            <Link href="/login" className="hover:text-primary">
              {pickText(locale, "Back to login", "返回登录")}
            </Link>
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
