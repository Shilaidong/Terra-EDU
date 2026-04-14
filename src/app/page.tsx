/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Bot, Compass, Quote, Shield, Sparkles, Users } from "lucide-react";

import { LocaleSwitcher } from "@/components/locale-provider";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

const timelineRows = [
  {
    title: { en: "Standardized Exams", zh: "标化考试" },
    segments: [
      { label: { en: "SAT Prep", zh: "SAT 备考" }, start: "8%", width: "16%", tone: "bg-primary-container text-on-primary-container" },
      { label: { en: "ACT Mock", zh: "ACT 模考" }, start: "31%", width: "11%", tone: "bg-primary text-on-primary" },
    ],
    markers: [],
  },
  {
    title: { en: "Application Progress", zh: "申请进度" },
    segments: [
      { label: { en: "Essay Brainstorming", zh: "文书构思" }, start: "2%", width: "36%", tone: "bg-tertiary-container text-on-tertiary-container" },
      { label: { en: "Portfolio Review", zh: "材料复盘" }, start: "42%", width: "24%", tone: "bg-tertiary text-on-tertiary" },
    ],
    markers: [],
  },
  {
    title: { en: "Activities & Competitions", zh: "活动与竞赛" },
    segments: [
      { label: { en: "Regional Science Fair", zh: "区域科学竞赛" }, start: "21%", width: "49%", tone: "border border-primary/20 bg-surface-container-highest text-primary" },
    ],
    markers: [],
  },
  {
    title: { en: "Deadlines", zh: "截止事项" },
    segments: [],
    markers: ["15%", "45%", "85%"],
  },
];

const executionItems = [
  {
    title: { en: "Finalize activity story draft", zh: "完成活动故事线初稿" },
    state: "done",
  },
  {
    title: { en: "IELTS speaking mock #2", zh: "完成第 2 次雅思口语模考" },
    state: "todo",
  },
  {
    title: { en: "Update resume: Robotics lead", zh: "更新简历：机器人社负责人" },
    state: "scheduled",
  },
];

const roleCards = [
  {
    title: { en: "For Students", zh: "面向学生" },
    body: {
      en: "Own your journey with a distraction-free workspace. Turn big goals into manageable weekly tasks and keep your evolving narrative visible.",
      zh: "在一个不打扰思路的工作台里掌控自己的申请路径，把大目标拆成每周可执行的动作，并持续看见自己的成长轨迹。",
    },
    icon: Compass,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: { en: "For Parents", zh: "面向家长" },
    body: {
      en: "Replace anxious check-ins with passive clarity. View progress at a glance and understand the strategy without hovering.",
      zh: "用被动可见的方式替代焦虑式追问，不用反复催促，也能一眼看懂进度和整体策略。",
    },
    icon: Users,
    tone: "bg-tertiary/10 text-tertiary",
  },
  {
    title: { en: "For Consultants", zh: "面向顾问" },
    body: {
      en: "Scale your expertise through one coordinated workspace while keeping every student journey personal and precise.",
      zh: "在一个统一工作台里放大顾问能力，同时保持每位学生路径的个性化与精确度。",
    },
    icon: Shield,
    tone: "bg-secondary-container text-secondary",
  },
];

const processSteps = [
  {
    step: "01",
    title: { en: "Build profile", zh: "建立档案" },
    body: {
      en: "Ingest history, interests, and goals to establish the student’s baseline narrative and trajectory.",
      zh: "录入学生经历、兴趣和目标，建立后续所有规划与推荐的基础画像。",
    },
  },
  {
    step: "02",
    title: { en: "Visible timeline", zh: "可见时间线" },
    body: {
      en: "Visualize the multi-year journey instantly, highlighting exam windows, deadlines, and activity peaks.",
      zh: "把多年的升学路径可视化呈现，关键考试窗口、截止事项和活动高峰一目了然。",
    },
  },
  {
    step: "03",
    title: { en: "Shared context", zh: "共享上下文" },
    body: {
      en: "Invite parents and mentors into a single source of truth where everyone sees the same progress.",
      zh: "让家长和顾问进入同一份真实进度视图，所有沟通都建立在相同事实上。",
    },
  },
  {
    step: "04",
    title: { en: "AI with real background", zh: "AI 深入理解" },
    body: {
      en: "Recommendations come from documents, milestones, tasks, and achievements instead of generic guesswork.",
      zh: "AI 建议来自真实文档、里程碑、任务和成果记录，而不是空泛的模板式判断。",
    },
  },
];

const testimonials = [
  {
    role: { en: "Student", zh: "学生" },
    quote: {
      en: "Lodestar helped me see my application not as a series of chores, but as a story I was building week by week.",
      zh: "引路人让我第一次觉得申请不是一堆零散任务，而是一条可以每周持续搭建的完整路径。",
    },
    name: { en: "Student user", zh: "学生用户" },
    accent: "text-primary",
    fill: "bg-primary-fixed",
  },
  {
    role: { en: "Parent", zh: "家长" },
    quote: {
      en: "The peace of mind is invaluable. I can see progress late at night without asking another anxious question.",
      zh: "这种安心感真的很珍贵。我晚上打开平台就能看到进展，不需要再带着焦虑去追问孩子。",
    },
    name: { en: "Parent user", zh: "家长用户" },
    accent: "text-tertiary",
    fill: "bg-tertiary-fixed",
  },
  {
    role: { en: "Consultant", zh: "顾问" },
    quote: {
      en: "This is not another CRM. It is the coordination layer that lets strategy and execution finally stay aligned.",
      zh: "这不是另一套 CRM，而是真正把策略与执行放在同一层里的协作系统。",
    },
    name: { en: "Consultant user", zh: "顾问用户" },
    accent: "text-secondary",
    fill: "bg-secondary-container",
  },
];

const processFlowCards = [
  {
    title: { en: "Student profile", zh: "学生档案" },
    body: { en: "Goals, school context, milestones, and preferences are structured first.", zh: "先把目标、学校背景、里程碑和偏好整理成统一档案。" },
    tone: "bg-primary text-white",
    chips: {
      en: ["Profile", "Goals", "Records"],
      zh: ["档案", "目标", "记录"],
    },
  },
  {
    title: { en: "Planning engine", zh: "规划引擎" },
    body: { en: "Timeline, weekly actions, and deadline rhythm stay visible in one shared canvas.", zh: "时间线、每周行动和截止节奏会汇总到同一张可共享的规划画布里。" },
    tone: "bg-tertiary text-white",
    chips: {
      en: ["Timeline", "Weekly plan", "Deadlines"],
      zh: ["时间线", "周计划", "截止项"],
    },
  },
  {
    title: { en: "Family sync", zh: "家校同步" },
    body: { en: "Parents and consultants see the same progress, without fragmented screenshots or repeated reminders.", zh: "家长和顾问看到的是同一份进度，不再依赖零散截图和反复提醒。" },
    tone: "bg-surface-container-lowest text-on-background",
    chips: {
      en: ["Parents", "Consultant", "Shared view"],
      zh: ["家长", "顾问", "共享视图"],
    },
  },
  {
    title: { en: "AI context", zh: "AI 上下文" },
    body: { en: "Documents, tasks, planning book, and achievements feed into more grounded recommendations.", zh: "文档、任务、规划书和成果记录会一起进入 AI 的真实上下文。" },
    tone: "bg-secondary text-white",
    chips: {
      en: ["Documents", "Tasks", "Planning book"],
      zh: ["文档", "任务", "规划书"],
    },
  },
];

function Brand({ locale, compact = false }: { locale: string; compact?: boolean }) {
  return (
    <div className="leading-none">
      <div className={compact ? "font-serif text-2xl font-bold text-primary" : "font-serif text-3xl font-bold text-primary"}>
        {pickText(locale, "Lodestar", "引路人")}
      </div>
      <p className={compact ? "mt-1 text-[10px] uppercase tracking-[0.22em] text-secondary" : "mt-2 text-sm uppercase tracking-[0.24em] text-secondary"}>
        {pickText(locale, "Career Exploration System", "生涯探索系统")}
      </p>
    </div>
  );
}

function TestimonialAvatar({
  locale,
  index,
  fill,
}: {
  locale: "zh" | "en";
  index: number;
  fill: string;
}) {
  const labels = locale === "zh" ? ["学", "家", "顾"] : ["S", "P", "C"];
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${fill}`}>
      <span className="font-serif text-lg font-bold text-primary">{labels[index]}</span>
    </div>
  );
}

export default async function HomePage() {
  const locale = await getLocale();
  const monthLabels = locale === "zh" ? ["8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月", "6月", "7月"] : ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  return (
    <main className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#faf6f0]/90 shadow-[0_4px_20px_rgba(46,50,48,0.06)] backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Brand locale={locale} compact />
          <div className="flex items-center space-x-6">
            <LocaleSwitcher />
            <Link href="/login" className="terra-on-primary rounded-full bg-primary px-6 py-2.5 font-bold text-on-primary shadow-terra hover:text-on-primary">
              {pickText(locale, "Sign In", "登录")}
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-8 pb-32 pt-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="z-10">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {pickText(locale, "Student, parent, and consultant collaboration", "学生、家长、顾问三端协作")}
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {pickText(locale, "A single long-range planning view", "一张长期规划总览")}
              </span>
            </div>

            <h1 className="mb-6 font-serif text-5xl font-extrabold leading-[1.1] text-on-background md:text-6xl">
              {pickText(locale, "Your organic path to global education excellence.", "让成长自然发生，走向全球教育的卓越之路。")}
            </h1>

            <p className="mb-10 max-w-xl text-xl leading-relaxed text-on-surface-variant">
              {pickText(
                locale,
                "A premium coordination layer for students, parents, and consultants. Keep long-range planning, weekly execution, and key decisions aligned in one calm place.",
                "把学生、家长和顾问真正放进同一个协作场景里，让长期规划、每周执行和关键决策在一个安静而清晰的系统中持续推进。"
              )}
            </p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <Link href="/login" className="terra-on-primary rounded-lg bg-primary px-8 py-4 text-lg font-bold text-on-primary shadow-lg transition-all hover:text-on-primary hover:shadow-xl">
                {pickText(locale, "Start Your Journey", "开始使用")}
              </Link>
              <a href="#preview" className="rounded-lg border border-outline-variant bg-surface-container-low px-8 py-4 text-lg font-bold text-primary transition-all hover:bg-surface-container">
                {pickText(locale, "See the platform", "查看平台")}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-tertiary" />
              <span className="font-medium italic text-on-surface-variant">
                {pickText(locale, "AI guidance grounded in real records", "AI 建议建立在真实资料与真实进度之上")}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl lg:rotate-2">
              <img
                alt={pickText(locale, "Student and parent collaborating", "学生与家长共同查看规划")}
                src="/api/assets/home-hero"
                className="aspect-square h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 max-w-xs rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
              <div className="mb-3 flex gap-2">
                <span className="h-3 w-3 rounded-full bg-primary/20" />
                <span className="h-3 w-3 rounded-full bg-primary/40" />
                <span className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <p className="text-sm font-semibold italic text-primary">
                {pickText(locale, '"The transition from chaos to a single source of truth was immediate."', "“从混乱到共享同一份真实进度，几乎是立刻发生的变化。”")}
              </p>
            </div>
            <div className="absolute right-0 top-0 -z-10 h-full w-1/2 translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-container/30 blur-3xl" />
          </div>
        </div>
      </section>

      <section id="preview" className="bg-surface-container-low px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-4xl font-bold">
              {pickText(locale, "A real planning interface, not a brochure.", "看到的不是概念，而是真实的规划界面。")}
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-on-surface-variant">
              {pickText(
                locale,
                "The homepage now surfaces the same kind of timeline, progress view, and family-facing clarity that users will experience after login.",
                "首页直接展示登录后用户真正会看到的时间线、执行视图和家长可理解的协作结果。"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)] md:col-span-12 lg:col-span-8">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="font-body text-xl font-bold">{pickText(locale, "Yearly Journey Roadmap", "年度规划路线图")}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{pickText(locale, "Current", "当前")}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-tertiary" />{pickText(locale, "Upcoming", "即将到来")}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-12 gap-2 border-b border-outline-variant/10 pb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {monthLabels.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="space-y-4">
                  {timelineRows.map((row) => (
                    <div key={row.title.en} className="relative">
                      <div className="mb-1 text-xs font-bold opacity-60">{pickText(locale, row.title.en, row.title.zh)}</div>
                      <div className="relative h-8 overflow-hidden rounded-full bg-surface-container">
                        {row.segments.map((segment) => (
                          <div
                            key={segment.label.en}
                            className={`absolute flex h-full items-center rounded-full px-4 text-[10px] font-bold ${segment.tone}`}
                            style={{ left: segment.start, width: segment.width }}
                          >
                            {pickText(locale, segment.label.en, segment.label.zh)}
                          </div>
                        ))}
                        {row.markers.map((marker) => (
                          <div key={marker} className="absolute top-2 h-4 w-1 rounded-full bg-error" style={{ left: marker }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-primary p-8 text-white shadow-xl md:col-span-6 lg:col-span-4">
              <div>
                <h3 className="mb-6 font-body text-xl font-bold text-white">{pickText(locale, "Weekly Execution", "每周执行")}</h3>
                <ul className="space-y-4">
                  {executionItems.map((item) => (
                    <li key={item.title.en} className={`flex items-center gap-3 rounded-lg p-3 ${item.state === "done" ? "bg-white/10" : item.state === "todo" ? "bg-white/10" : "bg-white/10 opacity-60"}`}>
                      <span className="text-sm text-white">
                        {item.state === "done" ? "✓" : item.state === "todo" ? "○" : "◌"}
                      </span>
                      <span className="text-sm font-medium text-white">{pickText(locale, item.title.en, item.title.zh)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 border-t border-white/20 pt-6">
                <p className="mb-2 text-xs uppercase tracking-widest text-white/70">{pickText(locale, "Next Milestone", "下一个里程碑")}</p>
                <p className="text-lg font-bold text-white">{pickText(locale, "Early Action Submission", "早申递交")}</p>
                <p className="text-sm text-white/90">{pickText(locale, "14 Days Remaining", "剩余 14 天")}</p>
              </div>
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex flex-1 items-start gap-4 rounded-xl border border-tertiary/20 bg-tertiary p-6 text-white">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Bot className="h-5 w-5 text-on-tertiary" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold text-white">{pickText(locale, "AI Companion Suggestion", "AI 陪伴式建议")}</p>
                    <p className="text-sm leading-relaxed text-white/88">
                      {pickText(
                        locale,
                        'Based on your interest in Bio-Engineering, the regional competition in April aligns perfectly with your "Academic Rigor" narrative. Would you like to schedule prep sessions?',
                        "结合你对生物工程的兴趣，四月的区域性竞赛与“学术强度”这条申请主线非常匹配。要不要把备赛安排正式加入本周计划？"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center font-serif text-4xl font-bold">
            {pickText(locale, "One plan, three roles, a single shared reality.", "一份规划，三种角色，共享同一份真实进度。")}
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {roleCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title.en} className="group rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 transition-all hover:shadow-lg">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${item.tone}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-4 font-serif text-2xl font-bold">{pickText(locale, item.title.en, item.title.zh)}</h3>
                  <p className="leading-relaxed text-on-surface-variant">{pickText(locale, item.body.en, item.body.zh)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant/10 bg-background px-8 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div>
            <h2 className="mb-12 font-serif text-4xl font-bold">{pickText(locale, "How the experience unfolds", "平台体验如何展开")}</h2>
            <div className="space-y-12">
              {processSteps.map((item) => (
                <div key={item.step} className="flex gap-6">
                  <span className="font-headline text-4xl font-black text-primary/20">{item.step}</span>
                  <div>
                    <h4 className="mb-2 text-xl font-bold">{pickText(locale, item.title.en, item.title.zh)}</h4>
                    <p className="text-on-surface-variant">{pickText(locale, item.body.en, item.body.zh)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-black/5 bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                    {pickText(locale, "Live workflow preview", "实时流程预览")}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {pickText(locale, "How records become a shared plan", "资料如何变成所有人共享的行动规划")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/45" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
              </div>

              <div className="space-y-3">
                {processFlowCards.map((card, index) => (
                  <div key={card.title.en}>
                    <div className={`rounded-[1.6rem] border border-black/5 p-5 shadow-[0_16px_40px_rgba(46,50,48,0.06)] ${card.tone}`}>
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${card.tone.includes("text-white") ? "text-white/70" : "text-secondary"}`}>
                            {pickText(locale, "Module", "模块")}
                          </p>
                          <h3 className="mt-1 font-serif text-2xl font-bold">
                            {pickText(locale, card.title.en, card.title.zh)}
                          </h3>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${card.tone.includes("text-white") ? "bg-white/15 text-white" : "bg-surface-container text-primary"}`}>
                          {pickText(locale, "Active", "运行中")}
                        </span>
                      </div>

                      <p className={`max-w-lg text-sm leading-6 ${card.tone.includes("text-white") ? "text-white/90" : "text-on-surface-variant"}`}>
                        {pickText(locale, card.body.en, card.body.zh)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(locale === "zh" ? card.chips.zh : card.chips.en).map((chip) => (
                          <span
                            key={chip}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${card.tone.includes("text-white") ? "bg-white/15 text-white" : "bg-surface-container-low text-primary"}`}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    {index < processFlowCards.length - 1 ? (
                      <div className="flex justify-center py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-low text-primary">
                          ↓
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-tertiary-fixed opacity-60 blur-2xl" />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-20 text-center font-serif text-4xl font-bold">{pickText(locale, "Voices from the platform", "来自平台里的真实感受")}</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <div key={item.role.en} className="relative">
                <Quote className={`absolute -left-4 -top-8 h-14 w-14 ${item.accent} opacity-20`} />
                <p className="relative z-10 mb-6 text-lg italic leading-relaxed text-on-surface-variant">
                  “{pickText(locale, item.quote.en, item.quote.zh)}”
                </p>
                <div className="flex items-center gap-4">
                  <TestimonialAvatar locale={locale} index={index} fill={item.fill} />
                  <div>
                    <p className="text-sm font-bold">{pickText(locale, item.name.en, item.name.zh)}</p>
                    <p className={`text-xs font-bold uppercase ${item.accent}`}>{pickText(locale, item.role.en, item.role.zh)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-primary p-12 text-center text-white shadow-2xl">
          <div className="relative z-10">
            <h2 className="mb-6 font-serif text-4xl font-bold text-white md:text-5xl">
              {pickText(locale, "Ready to align your family’s future?", "准备好让整个家庭围绕同一条未来路径协同前进了吗？")}
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-white/90">
              {pickText(locale, "Join the premium community of students and mentors who prioritize clarity over chaos.", "加入一群更看重清晰、节奏与长期推进感的学生、家长和顾问。")}
            </p>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-surface-container-lowest px-10 py-5 text-xl font-bold transition-transform hover:scale-105"
              style={{ color: "#2e3230" }}
            >
              {pickText(locale, "Get Started Today", "立即开始")}
            </Link>
          </div>
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute left-10 top-10 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        </div>
      </section>

      <footer className="w-full border-t border-stone-200 bg-[#faf6f0] px-12 py-8 text-xs leading-relaxed dark:bg-stone-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <span className="text-stone-500 dark:text-stone-400">
              {pickText(locale, "© 2026 Lodestar Career Exploration System. All rights reserved.", "© 2026 引路人生涯探索系统。保留所有权利。")}
            </span>
          </div>
          <div className="flex space-x-8">
            <Link href="/privacy" className="text-stone-500 transition-all hover:text-primary hover:underline dark:text-stone-400">
              {pickText(locale, "Privacy", "隐私政策")}
            </Link>
            <Link href="/terms" className="text-stone-500 transition-all hover:text-primary hover:underline dark:text-stone-400">
              {pickText(locale, "Terms", "服务条款")}
            </Link>
            <Link href="/login" className="font-semibold text-stone-500 transition-all hover:text-primary hover:underline dark:text-stone-400">
              {pickText(locale, "Product", "产品")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
