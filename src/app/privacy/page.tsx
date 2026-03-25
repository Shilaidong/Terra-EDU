import Link from "next/link";

import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Terra Edu
        </Link>
        <h1 className="mt-6 font-serif text-5xl font-bold">{pickText(locale, "Privacy Policy", "隐私政策")}</h1>
        <p className="mt-4 text-secondary">{pickText(locale, "Last updated: March 25, 2026", "最后更新：2026 年 3 月 25 日")}</p>

        <div className="mt-10 space-y-8 rounded-[2rem] bg-white p-8 shadow-terra">
          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "What we collect", "我们收集的信息")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "Terra Edu may store account details, education-planning records, tasks, milestones, content management actions, and AI-generated summaries. In the current launch build, observability data also includes `trace_id`, `decision_id`, actor, page, latency, and status.", "Terra Edu 可能会存储账号信息、升学规划记录、任务、截止日期、内容管理操作以及 AI 生成的摘要。在当前首发版本中，可观测性数据还会包括 `trace_id`、`decision_id`、操作者、页面、耗时和状态。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Why we collect it", "为什么收集这些信息")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "We use this information to operate student, parent, and consultant workflows, improve reliability, and diagnose bugs quickly. AI outputs are stored to make future debugging and audit review easier.", "我们使用这些信息来支持学生、家长和顾问的工作流，提升系统稳定性，并更快定位问题。保存 AI 输出的目的也是为了方便后续调试和审计复查。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Monitoring and diagnostics", "监控与诊断")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "If Sentry is configured, runtime errors and selected request metadata may be sent to Sentry. If Supabase is configured, audit logs and AI artifacts may also be persisted for operational review.", "如果配置了 Sentry，运行时错误和部分请求元数据可能会发送到 Sentry；如果配置了 Supabase，审计日志和 AI 结果也可能会被持久化，用于后续运营和排查。")}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">{pickText(locale, "Your choices", "你的选择")}</h2>
            <p className="mt-3 leading-8 text-secondary">
              {pickText(locale, "You can request account updates or data removal through the support channel you publish with the product. Before public launch, replace this placeholder policy with your business-specific legal text and contact details.", "你可以通过产品中公开的支持渠道申请更新账号信息或删除数据。在正式公开上线前，请把这份占位政策替换成与你业务相对应的正式法律文本和联系方式。")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
