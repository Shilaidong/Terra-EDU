import Link from "next/link";

import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export default async function TermsPage() {
  const locale = await getLocale();
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Terra Edu
        </Link>
        <h1 className="mt-6 font-serif text-5xl font-bold">{pickText(locale, "Terms of Service", "服务条款")}</h1>
        <p className="mt-4 text-secondary">{pickText(locale, "Last updated: March 25, 2026", "最后更新：2026 年 3 月 25 日")}</p>

        <div className="mt-10 space-y-8 rounded-[2rem] bg-white p-8 shadow-terra">
          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Use of the platform", "平台使用")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "Terra Edu is an education-planning tool for students, parents, and consultants. It helps organize tasks, content, and guidance, but it does not guarantee admissions outcomes.", "Terra Edu 是为学生、家长和顾问设计的教育规划工具。它可以帮助组织任务、内容和指导流程，但不保证录取结果。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Accounts and access", "账号与访问权限")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "Users are responsible for protecting their credentials and using role-based access appropriately. Parent accounts are read-only in the current launch workflow and should not attempt to bypass permission boundaries.", "用户需要自行妥善保管登录信息，并按角色权限规范使用系统。在当前首发流程中，家长账号为只读权限，不应尝试绕过权限边界。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "AI-generated content", "AI 生成内容")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "AI suggestions are provided as operational guidance, not professional, legal, or admissions guarantees. Human review remains important for decisions and submissions.", "AI 建议仅作为操作和规划参考，不构成专业、法律或录取保证。涉及重要决策和正式提交时，仍然需要人工审核。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Launch-stage limitation", "首发阶段说明")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "This product currently includes placeholder modules, evolving integrations, and observability tooling for rapid bug fixing. Before public launch, replace this placeholder text with your business-specific legal terms.", "当前产品仍包含部分占位模块、持续演进中的接入项，以及为快速修复问题准备的可观测工具。在正式公开上线前，请将这些占位文本替换成符合你业务实际的正式条款。")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
