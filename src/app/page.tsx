/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Bot, Compass, Shield, Sparkles, Users } from "lucide-react";

import { LocaleSwitcher } from "@/components/locale-provider";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf6f0]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-serif text-2xl font-bold text-primary">Terra Global Ed</div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-lg font-semibold text-primary">
              {pickText(locale, "Features", "功能")}
            </a>
            <a href="#roles" className="text-lg text-secondary transition-colors hover:text-primary">
              {pickText(locale, "About", "关于")}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/login"
              className="terra-on-primary rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:text-white"
            >
              {pickText(locale, "Sign In", "登录")}
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 pb-32 pt-20 md:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="font-serif text-5xl font-bold leading-[1.05] text-foreground md:text-7xl">
              {pickText(locale, "Your organic path to global education ", "让成长自然发生，走向全球教育的 ")}
              <span className="whitespace-nowrap italic text-primary">{pickText(locale, "excellence.", "卓越之路。")}</span>
            </h1>
            <p className="max-w-xl text-xl leading-9 text-secondary">
              {pickText(locale, "A grounded, human approach to international admissions. We combine AI-driven precision with holistic mentorship to help every stakeholder move with confidence.", "以更扎实、更有人味的方式面对国际升学。我们把 AI 的精确能力与长期陪伴式指导结合起来，让每一个角色都能更从容地推进申请。")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="terra-on-primary rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-terra hover:text-white"
              >
                {pickText(locale, "Start Your Journey", "开始使用")}
              </Link>
              <a
                href="#features"
                className="rounded-2xl border border-outline-variant bg-surface-container px-8 py-4 text-lg font-bold text-primary"
              >
                {pickText(locale, "View Features", "查看功能")}
              </a>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-secondary">
              <span className="rounded-full bg-surface-container px-4 py-2">{pickText(locale, "Vercel-ready deployment", "支持 Vercel 部署")}</span>
              <span className="rounded-full bg-surface-container px-4 py-2">{pickText(locale, "Supabase adapter included", "内置 Supabase 适配")}</span>
              <span className="rounded-full bg-surface-container px-4 py-2">{pickText(locale, "Traceable AI workflows", "可追踪的 AI 工作流")}</span>
            </div>
          </div>

          <div className="organic-glow">
            <img
              alt="Terra Edu home page visual"
              src="/api/assets/home-hero"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover ring-8 ring-surface-container-low shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="roles" className="bg-surface-container-low px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-4xl font-bold">{pickText(locale, "Empowering the ecosystem", "赋能整个升学协作生态")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-secondary">
              {pickText(locale, "One platform, three perspectives. Tailored experiences for every stakeholder in the education journey.", "一个平台，三种视角。为学生、家长和顾问提供各自适配的使用体验。")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: pickText(locale, "Students", "学生"),
                body: pickText(locale, "Goal tracking, AI assistance, time-based planning, and mastery check-ins that keep momentum visible.", "目标追踪、AI 辅助、时间规划和学习打卡，让成长进度始终清晰可见。"),
                icon: <Compass className="h-6 w-6" />,
                tone: "text-primary bg-primary/10",
              },
              {
                title: pickText(locale, "Parents", "家长"),
                body: pickText(locale, "Peace of mind through visibility. Stay aligned with progress, milestones, and consultant updates without micromanaging.", "通过清晰可见的进展获得安心。不必过度介入，也能同步了解进度、里程碑和顾问动态。"),
                icon: <Users className="h-6 w-6" />,
                tone: "text-tertiary bg-tertiary/10",
              },
              {
                title: pickText(locale, "Consultants", "顾问"),
                body: pickText(locale, "Cohort management, content operations, analytics, import workflows, and AI-assisted reporting in one place.", "学生群组管理、内容运营、分析看板、导入流程与 AI 报告能力，全部集中在一个工作台里。"),
                icon: <Shield className="h-6 w-6" />,
                tone: "text-secondary bg-secondary-container",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-surface p-8 shadow-terra transition-transform hover:-translate-y-1">
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>{item.icon}</div>
                <h3 className="font-serif text-2xl font-bold text-primary">{item.title}</h3>
                <p className="mt-4 leading-8 text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="grid gap-6">
            <div className="flex items-start gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
              <Sparkles className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h4 className="text-lg font-bold text-foreground">{pickText(locale, "Gantt-style planning and milestones", "甘特图规划与里程碑")}</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">{pickText(locale, "Track exams, essays, deadlines, and applications across long planning cycles.", "用甘特图追踪考试、文书、申请和截止日期，适配长期升学规划。")}</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
                <Bot className="h-8 w-8 text-tertiary" />
                <h4 className="mt-4 text-lg font-bold">{pickText(locale, "AI Twin & recommendations", "AI 数字分身与推荐")}</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">{pickText(locale, "Summaries, suggestions, and prompt-versioned outputs with trace ids.", "支持总结、建议与带 trace id 的版本化 AI 输出。")}</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
                <Shield className="h-8 w-8 text-primary" />
                <h4 className="mt-4 text-lg font-bold">{pickText(locale, "Logs built for future AI bug fixing", "为后续 AI 修 Bug 设计的日志系统")}</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">{pickText(locale, "Every mutation stores actor, page, action, latency, trace_id, and decision_id.", "每次变更都会记录操作者、页面、动作、耗时、trace_id 和 decision_id。")}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-4xl font-bold">{pickText(locale, "Tools built for the modern student.", "为当代学生打造的升学工具。")}</h2>
            <p className="mt-4 text-lg leading-9 text-secondary">
              {pickText(locale, "Education planning should not feel like paperwork. Terra combines warm design with structured backend behavior so the product can launch cleanly and stay maintainable.", "升学规划不该像填表。Terra 把有温度的设计和结构化后端结合起来，让产品既能顺利上线，也方便后续维护。")}
            </p>
            <div className="mt-8 rounded-3xl bg-primary p-8 text-white shadow-terra">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">{pickText(locale, "AI Innovation", "AI 创新")}</p>
              <h3 className="mt-3 font-serif text-4xl font-bold">{pickText(locale, "Your digital twin for global success", "面向全球升学的数字分身助手")}</h3>
              <p className="mt-4 max-w-2xl text-white/85">
                {pickText(locale, "The launch version ships practical AI: recommendation summaries, study prioritization, risk notes, and consultant reporting prompts with full traceability.", "首发版本会提供实用型 AI：推荐总结、学习优先级建议、风险提示和顾问报告草稿，并且全程可追踪。")}
              </p>
              <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary">
                {pickText(locale, "Enter the product", "进入产品")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-secondary md:flex-row md:items-center md:justify-between">
          <p>{pickText(locale, "© 2026 Terra Edu. International education planning platform.", "© 2026 Terra Edu. 国际教育规划平台。")}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-primary">
              {pickText(locale, "Privacy", "隐私政策")}
            </Link>
            <Link href="/terms" className="hover:text-primary">
              {pickText(locale, "Terms", "服务条款")}
            </Link>
            <Link href="/login" className="hover:text-primary">
              {pickText(locale, "Product", "产品")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
