import { redirect } from "next/navigation";
import Link from "next/link";

import { AccessPlansDialog } from "@/components/access-plans-dialog";
import { LocaleSwitcher } from "@/components/locale-provider";
import { LoginForm } from "@/components/client-tools";
import { getAccessPlanDemoAccounts } from "@/lib/data";
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

  const accounts = getAccessPlanDemoAccounts();

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
              <p className="mt-2 text-secondary">{pickText(locale, "Sign in with the launch demo accounts or connect your formal credentials later.", "你可以先使用演示账号登录，后续再接入正式账号。")}</p>
            </div>
            <LocaleSwitcher />
          </div>

          <LoginForm
            allowedRoles={["student", "parent", "consultant"]}
            secondaryAction={
              <AccessPlansDialog
                locale={locale}
                accounts={accounts}
                triggerLabel={pickText(locale, "Register", "注册")}
                triggerClassName="inline-flex w-full items-center justify-center rounded-2xl border border-outline-variant bg-white px-5 py-3 text-lg font-bold text-primary transition hover:bg-surface-container-low"
              />
            }
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-secondary">
              <p className="font-semibold text-foreground">{pickText(locale, "Already have an account?", "已有账号？")}</p>
              <p className="mt-1">{pickText(locale, "Use the login form above to enter the platform directly.", "直接使用上方登录表单进入平台。")}</p>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-white px-4 py-4">
              <p className="text-sm font-semibold text-foreground">{pickText(locale, "Need to register?", "需要注册？")}</p>
              <p className="mt-1 text-sm text-secondary">
                {pickText(locale, "Open the access plan and contact Teacher Shi before activation.", "先查看开通方案，再联系史老师完成开通。")}
              </p>
              <div className="mt-3">
                <AccessPlansDialog
                  locale={locale}
                  accounts={accounts}
                  triggerLabel={pickText(locale, "Register", "注册")}
                  triggerClassName="inline-flex w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container"
                />
              </div>
            </div>
          </div>

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
                  <p className="mt-2 text-xs leading-6 text-secondary">
                    {account.role === "student"
                      ? pickText(
                          locale,
                          "See the timeline, documents, AI guidance, and the full student-facing workflow in one account.",
                          "可直接体验时间线、材料中心、AI 助手和完整学生端工作流。"
                        )
                      : account.role === "parent"
                        ? pickText(
                            locale,
                            "See parent-facing progress, shared deadlines, and how the family stays synced without repeated checking.",
                            "可直接体验家长端如何查看进度、共享截止事项，以及家校之间如何保持同步。"
                          )
                      : pickText(
                          locale,
                          "See student workspace management, planning book editing, AI reports, and content operations.",
                          "可直接体验学生工作台、规划书编辑、AI 周报和内容管理等顾问能力。"
                        )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Student demo", "学生示例")}</p>
              <p className="mt-2 text-sm text-secondary">
                {pickText(locale, "Best for seeing planning, check-ins, documents, and AI guidance as a student would actually use them.", "适合查看规划、打卡、材料中心和 AI 助手在学生端的真实使用方式。")}
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Parent demo", "家长示例")}</p>
              <p className="mt-2 text-sm text-secondary">
                {pickText(locale, "Best for seeing how parents check progress, milestones, and consultant updates without interrupting the student rhythm.", "适合查看家长如何在不打断学生节奏的情况下，理解进展、里程碑和顾问反馈。")}
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Consultant demo", "顾问示例")}</p>
              <p className="mt-2 text-sm text-secondary">
                {pickText(locale, "Best for seeing student management, planning book maintenance, content operations, and consultant-side AI workflows.", "适合查看学生管理、规划书维护、内容库操作和顾问侧 AI 工作流。")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary">
            <AccessPlansDialog
              locale={locale}
              accounts={accounts}
              triggerLabel={pickText(locale, "Create account", "注册账号")}
              triggerClassName="hover:text-primary"
            />
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
