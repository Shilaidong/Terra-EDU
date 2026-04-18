/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Bot, BookOpenText, Compass, FileText, FolderOpen, HelpCircle, LayoutDashboard, LifeBuoy, LineChart, MessageCircle, NotebookPen, PiggyBank, Settings, Sparkles, Users } from "lucide-react";

import { LocaleSwitcher } from "@/components/locale-provider";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getRoleNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { AuditLog, Milestone, SessionPayload, Task, TimelineLane, TimelineView, UserRole } from "@/lib/types";

const iconMap = {
  dashboard: LayoutDashboard,
  timeline: NotebookPen,
  checkin: BookOpenText,
  explore: Compass,
  settings: Settings,
  applications: FileText,
  documents: FolderOpen,
  messages: MessageCircle,
  finances: PiggyBank,
  support: LifeBuoy,
  students: Users,
  content: BookOpenText,
  analytics: LineChart,
};

function NavIcon({ href }: { href: string }) {
  const key = href.split("/").filter(Boolean).at(-1) ?? "dashboard";
  const Icon = iconMap[key as keyof typeof iconMap] ?? Sparkles;
  return <Icon className="h-4 w-4" />;
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-3 pb-20 pt-36 sm:px-5 sm:pt-32 md:px-6 md:pb-14 md:pt-24">{children}</div>;
}

export async function RoleShell({
  session,
  title,
  subtitle,
  activeHref,
  hero,
  children,
}: {
  session: SessionPayload;
  title: string;
  subtitle: string;
  activeHref: string;
  hero?: React.ReactNode;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const navItems = getRoleNav(locale)[session.role];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[#faf6f0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 md:h-16 md:px-6 md:py-0">
          <div className="flex min-w-0 items-center gap-3 md:gap-8">
            <Link href="/" className="truncate font-serif text-lg font-bold text-primary sm:text-2xl">
              {pickText(locale, "Lodestar Pathways", "引路人生涯")}
            </Link>
            <nav className="hidden gap-4 md:flex">
              {navItems.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                    item.href === activeHref
                      ? "bg-primary/10 text-primary"
                      : "text-secondary hover:bg-black/5 hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LocaleSwitcher className="inline-flex md:hidden" />
            <LocaleSwitcher className="hidden md:inline-flex" />
            <img
              alt={session.name}
              src={session.avatar ?? getAvatarForRole(session.role)}
              className="h-9 w-9 rounded-full border border-outline-variant object-cover sm:h-10 sm:w-10"
            />
          </div>
        </div>

        <div className="border-t border-black/5 px-3 py-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all",
                  item.href === activeHref
                    ? "border-2 border-primary/45 bg-primary/10 text-primary shadow-sm"
                    : "bg-surface-container-low text-secondary"
                )}
              >
                <NavIcon href={item.href} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/5 bg-[#faf6f0] pt-20 lg:flex lg:flex-col">
        <div className="px-6">
          <div className="rounded-2xl bg-surface-container-low p-4 shadow-terra">
            <div className="flex items-center gap-3">
              <img
                alt={session.name}
                src={session.avatar ?? getAvatarForRole(session.role)}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{session.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-secondary">
                  {pickText(
                    locale,
                    `${session.role} portal`,
                    session.role === "admin"
                      ? "管理后台"
                      : session.role === "student"
                        ? "学生端"
                        : session.role === "parent"
                          ? "家长端"
                          : "顾问端"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                item.href === activeHref
                  ? "translate-x-1 bg-primary/10 text-primary"
                  : "text-secondary hover:bg-black/5 hover:text-primary"
              )}
            >
              <NavIcon href={item.href} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="lg:ml-64">
        <PageContainer>
          <div className="mb-8 flex flex-col gap-4 pt-1 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-5 md:pt-0">
            <div>
              <h1 className="font-serif text-[1.9rem] font-bold leading-tight text-foreground sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-secondary sm:text-base">{subtitle}</p>
            </div>
            {hero ? <div className="w-full md:w-auto">{hero}</div> : null}
          </div>
          {children}
        </PageContainer>
      </main>
    </div>
  );
}

export function HeroBadge({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/90 px-4 py-4 shadow-terra sm:px-5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs sm:tracking-[0.2em]">
        {icon}
        {title}
      </div>
      <div className="font-serif text-2xl font-bold text-primary sm:text-3xl">{value}</div>
    </div>
  );
}

export function SectionCard({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl bg-surface-container-lowest p-5 shadow-terra sm:p-6", className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{eyebrow}</p>
          ) : null}
          <h2 className="font-serif text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "primary" | "tertiary" | "secondary";
}) {
  const styles =
    tone === "primary"
      ? "bg-primary/5 text-primary"
      : tone === "tertiary"
        ? "bg-tertiary/10 text-tertiary"
        : "bg-secondary-container text-secondary";

  return (
    <div className="rounded-[1.35rem] border border-black/5 bg-surface-container-lowest p-4 shadow-terra sm:rounded-3xl sm:p-6">
      <div className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] sm:px-3 sm:text-xs sm:tracking-[0.2em]", styles)}>
        {label}
      </div>
      <div className="mt-3 font-serif text-[1.7rem] font-bold leading-none text-foreground sm:mt-4 sm:text-4xl">{value}</div>
      <p className="mt-2 text-xs leading-6 text-secondary sm:mt-3 sm:text-sm">{hint}</p>
    </div>
  );
}

export async function TaskList({
  tasks,
  action,
}: {
  tasks: {
    id: string;
    title: string;
    description: string;
    startDate?: string;
    endDate?: string;
    timelineLane?: TimelineLane;
    dueLabel: string;
    category: string;
    priority: string;
    status: string;
  }[];
  action?: (taskId: string) => React.ReactNode;
}) {
  const locale = await getLocale();
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        {pickText(locale, "No timeline tasks yet. Add your first item above and it will appear here immediately.", "还没有时间线任务。你在上方新增后，这里会立即显示。")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-[1.2rem] border border-black/5 bg-surface-container-low px-4 py-3 transition-colors hover:border-primary/30 sm:rounded-2xl sm:px-5 sm:py-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-foreground sm:text-lg">{task.title}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary sm:px-3 sm:text-xs">
                  {task.timelineLane ? getLaneLabel(task.timelineLane, locale) : task.category}
                </span>
                <span className="rounded-full bg-tertiary/10 px-2.5 py-1 text-[11px] font-bold text-tertiary sm:px-3 sm:text-xs">
                  {task.priority}
                </span>
              </div>
              <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm">{task.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-outline sm:text-xs sm:tracking-[0.2em]">
                {task.startDate && task.endDate ? (
                  <span>{formatTaskRange(task.startDate, task.endDate)}</span>
                ) : null}
                <span>{task.dueLabel}</span>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary shadow-sm sm:px-3 sm:text-xs sm:tracking-[0.2em]">
                {translateTaskStatus(task.status, locale)}
              </span>
              {action?.(task.id)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const ganttLaneMeta: {
  lane: TimelineLane;
  label: { en: string; zh: string };
  subtitle: { en: string; zh: string };
  barClassName: string;
  markerClassName: string;
}[] = [
  {
    lane: "standardized_exams",
    label: { en: "Standardized Exams", zh: "标化考试" },
    subtitle: { en: "Scores and test readiness", zh: "分数与考试准备" },
    barClassName: "bg-primary-container/45 border border-primary/20 text-[#2a6038]",
    markerClassName: "bg-primary",
  },
  {
    lane: "application_progress",
    label: { en: "Applications", zh: "申请进度" },
    subtitle: { en: "Essays, forms, and interviews", zh: "文书、表格与面试" },
    barClassName: "bg-secondary-container border border-secondary/20 text-[#4a4538]",
    markerClassName: "bg-tertiary",
  },
  {
    lane: "activities",
    label: { en: "Extracurriculars", zh: "活动安排" },
    subtitle: { en: "Leadership, research, and service", zh: "领导力、科研与服务" },
    barClassName: "bg-tertiary-fixed-dim/20 border border-tertiary/10 text-[#554020]",
    markerClassName: "bg-tertiary-container",
  },
  {
    lane: "competitions",
    label: { en: "Competitions", zh: "竞赛安排" },
    subtitle: { en: "Challenges and showcases", zh: "竞赛与展示" },
    barClassName: "bg-primary/10 border border-primary/15 text-primary",
    markerClassName: "bg-primary-fixed-dim",
  },
];

export async function TaskGanttChart({
  tasks,
  milestones,
  view,
  rangeStart,
}: {
  tasks: Task[];
  milestones: Milestone[];
  view: TimelineView;
  rangeStart: Date;
}) {
  const locale = await getLocale();
  if (tasks.length === 0 && milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        {pickText(locale, "Add a timeline task or deadline to generate the gantt view.", "新增时间线任务或截止日期后，这里会生成甘特图。")}
      </div>
    );
  }

  const timeline = buildTimelineColumns(rangeStart, view);
  const minWidth = 240 + timeline.columns.length * timeline.columnWidth;

  return (
    <div className="overflow-x-auto rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_4px_20px_rgba(46,50,48,0.06)] sm:rounded-[1.5rem]">
      <div className="min-w-full" style={{ width: `${minWidth}px` }}>
        <div className="grid grid-cols-[180px_minmax(0,1fr)] border-b border-outline-variant/30 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-3 text-xs font-bold text-primary sm:px-4 sm:py-4 sm:text-sm md:px-6 md:py-5">
            <CalendarBadge />
            {pickText(locale, timeline.label, translateTimelineLabel(timeline.label))}
          </div>
          <div
            className="grid bg-surface-container-low"
            style={{
              gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
            }}
          >
            {timeline.columns.map((column) => (
              <div
                key={column.key}
                className="border-l border-outline-variant/20 px-2 py-3 text-center sm:px-3 sm:py-4"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline sm:text-xs sm:tracking-[0.18em]">
                  {column.label}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-secondary sm:text-[11px]">{column.sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {ganttLaneMeta.map((lane) => {
            const laneTasks = tasks.filter((task) => task.timelineLane === lane.lane);

            return (
              <div key={lane.lane} className="grid grid-cols-[180px_minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)]">
                <div className="flex flex-col justify-center bg-white px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
                  <p className="text-sm font-bold text-primary">{pickText(locale, lane.label.en, lane.label.zh)}</p>
                  <p className="mt-1 text-[11px] text-secondary sm:text-xs">{pickText(locale, lane.subtitle.en, lane.subtitle.zh)}</p>
                </div>

                <div className="relative overflow-hidden bg-white px-0 py-2.5 sm:py-3">
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                    }}
                  >
                    {timeline.columns.map((column) => (
                      <div
                        key={column.key}
                        className="h-full border-l border-outline-variant/10"
                      />
                    ))}
                  </div>

                  {laneTasks.length > 0 ? (
                    <div className="relative z-10 space-y-2.5 px-3 sm:space-y-3 sm:px-4">
                      {laneTasks
                        .sort(
                          (left, right) =>
                            parseDate(left.startDate).getTime() - parseDate(right.startDate).getTime()
                        )
                        .map((task) => {
                          const placement = getTaskPlacement(task, timeline.columns);

                          if (!placement) {
                            return null;
                          }

                          return (
                            <div
                              key={task.id}
                              className="grid items-center"
                              style={{
                                gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                              }}
                            >
                              <div
                                className={cn(
                                  "relative h-8 rounded-full px-3 shadow-sm transition-colors hover:opacity-90 sm:h-9 sm:px-4",
                                  lane.barClassName
                                )}
                                style={{ gridColumn: `${placement.start + 1} / ${placement.end + 2}` }}
                              >
                                <div className="flex h-full items-center">
                                  <span className="truncate text-[11px] font-bold sm:text-xs">{task.title}</span>
                                </div>
                                <div
                                  className={cn(
                                    "absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 rounded-[3px] shadow-sm sm:-right-2 sm:h-4 sm:w-4",
                                    lane.markerClassName
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div
                      className="relative z-10 grid px-4 py-2"
                      style={{
                        gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                      }}
                    >
                      {timeline.columns.map((column) => (
                        <div key={column.key} className="h-10" />
                      ))}
                      <p className="col-span-full px-2 text-xs text-secondary sm:text-sm">
                        {pickText(locale, "No items scheduled in this lane yet.", "这一栏目前还没有安排内容。")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-[180px_minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex flex-col justify-center bg-white px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
              <p className="text-sm font-bold text-primary">{pickText(locale, "Deadline", "截止日期")}</p>
              <p className="mt-1 text-[11px] text-secondary sm:text-xs">{pickText(locale, "Milestones and hard submission dates", "里程碑与硬性截止时间")}</p>
            </div>

            <div className="relative overflow-hidden bg-white px-0 py-2.5 sm:py-3">
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                }}
              >
                {timeline.columns.map((column) => (
                  <div
                    key={column.key}
                    className="h-full border-l border-outline-variant/10"
                  />
                ))}
              </div>

              {milestones.length > 0 ? (
                <div className="relative z-10 space-y-2.5 px-3 sm:space-y-3 sm:px-4">
                  {milestones
                    .slice()
                    .sort(
                      (left, right) =>
                        parseDate(left.eventDate).getTime() - parseDate(right.eventDate).getTime()
                    )
                    .map((milestone) => {
                      const placement = getMilestonePlacement(milestone, timeline.columns);

                      if (placement === -1) {
                        return null;
                      }

                      return (
                        <div
                          key={milestone.id}
                          className="grid items-center"
                          style={{
                            gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                          }}
                        >
                          <div
                            className="relative h-8 rounded-full border border-outline/20 bg-surface-container-highest px-3 text-on-surface-variant shadow-sm transition-colors hover:opacity-90 sm:h-9 sm:px-4"
                            style={{ gridColumn: `${placement + 1} / ${placement + 2}` }}
                          >
                            <div className="flex h-full items-center">
                              <span className="truncate text-[11px] font-bold sm:text-xs">{milestone.title}</span>
                            </div>
                            <div className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-error shadow-sm sm:h-3 sm:w-3" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div
                  className="relative z-10 grid px-4 py-2"
                  style={{
                    gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(${timeline.columnWidth}px, ${timeline.columnWidth}px))`,
                  }}
                >
                  {timeline.columns.map((column) => (
                    <div key={column.key} className="h-10" />
                  ))}
                  <p className="col-span-full px-2 text-xs text-secondary sm:text-sm">
                    {pickText(locale, "No deadlines scheduled in this calendar window yet.", "当前时间窗口内还没有截止日期。")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function TimelineRail({
  milestones,
  action,
}: {
  milestones: { id: string; title: string; dateLabel: string; eventDate?: string; status: string; type: string }[];
  action?: (milestoneId: string) => React.ReactNode;
}) {
  const locale = await getLocale();
  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        {pickText(locale, "No milestones are scheduled inside this calendar window yet.", "当前时间窗口内还没有里程碑。")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones
        .slice()
        .sort((left, right) => String(left.eventDate ?? left.dateLabel).localeCompare(String(right.eventDate ?? right.dateLabel)))
        .map((milestone) => (
        <div key={milestone.id} className="relative rounded-2xl border border-black/5 bg-surface-container-low px-5 py-4">
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-primary" />
          <div className="ml-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-foreground">{milestone.title}</h3>
              <p className="mt-1 text-sm text-secondary">{pickText(locale, "deadline", "截止日期")}</p>
              {action ? action(milestone.id) : null}
            </div>
            <div className="text-left sm:text-right">
              <div className="font-serif text-xl font-bold text-primary">{milestone.dateLabel}</div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-outline">
                {milestone.status}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function AuditFeed({ logs }: { logs: AuditLog[] }) {
  const locale = await getLocale();
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-black/5 bg-surface-container-low p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-foreground">{log.action}</p>
              <p className="mt-1 text-sm text-secondary">
                {log.targetType} · {log.targetId}
              </p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.2em] text-outline">
              <p>{translateActorRole(log.actorRole, locale)}</p>
              <p>{log.latencyMs}ms</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs text-secondary shadow-sm">
            <p>{pickText(locale, "Recorded for internal review", "已记录到系统更新中")}</p>
            <p>{pickText(locale, "Visible in internal diagnostics only", "仅用于内部排查与诊断")}</p>
            <p className="mt-2">{log.outputSummary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function PlaceholderCard({
  role,
  title,
  description,
}: {
  role: UserRole;
  title: string;
  description: string;
}) {
  const locale = await getLocale();
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
      <SectionCard title={title} eyebrow={pickText(locale, "Launch-safe placeholder", "上线安全占位页")}>
        <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8">
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">{pickText(locale, "No dead links, clear next step", "无死链，下一步清晰")}</p>
          </div>
          <p className="mt-4 max-w-2xl text-secondary">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={role === "consultant" ? "/consultant/content" : `/${role}/dashboard`}
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
            >
              {pickText(locale, "Return to active workflow", "返回当前可用流程")}
            </Link>
            <Link
              href={role === "consultant" ? "/consultant/analytics" : role === "admin" ? "/admin/dashboard" : `/${role}/settings`}
              className="rounded-full border border-outline-variant px-4 py-2.5 text-sm font-bold text-primary sm:px-5 sm:py-3"
            >
              {pickText(locale, "Review current setup", "查看当前配置")}
            </Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={pickText(locale, "What is already live", "当前已上线")} eyebrow={pickText(locale, "Today", "今天")}>
        <ul className="space-y-3 text-sm text-secondary">
          <li className="rounded-2xl bg-surface-container-low p-4">{pickText(locale, "Role-based routing and protected sessions", "基于角色的路由与受保护会话")}</li>
          <li className="rounded-2xl bg-surface-container-low p-4">{pickText(locale, "A shared planning workspace for students, parents, and consultants", "学生、家长和顾问共享的一体化规划工作台")}</li>
          <li className="rounded-2xl bg-surface-container-low p-4">{pickText(locale, "Shared Terra design system for later AI bug fixing", "统一的 Terra 设计系统，方便后续 AI 修复问题")}</li>
        </ul>
      </SectionCard>
    </div>
  );
}

function translateTimelineLabel(label: string) {
  if (label.includes("3-Year")) {
    return "三年视图";
  }

  if (label.includes("Month")) {
    return "月视图";
  }

  return "年视图";
}

function getAvatarForRole(role: UserRole) {
  if (role === "admin") {
    return "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80";
  }

  if (role === "student") {
    return "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80";
  }

  if (role === "parent") {
    return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";
  }

  return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";
}

export function InfoPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1.5 text-xs font-semibold text-secondary sm:px-4 sm:py-2 sm:text-sm">
      {icon}
      {label}
    </div>
  );
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dayDiff(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatTaskRange(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

function getLaneLabel(lane: TimelineLane, locale: Awaited<ReturnType<typeof getLocale>>) {
  const matchedLane = ganttLaneMeta.find((item) => item.lane === lane);
  if (!matchedLane) {
    return pickText(locale, "Timeline", "时间线");
  }
  return pickText(locale, matchedLane.label.en, matchedLane.label.zh);
}

type TimelineColumn = {
  key: string;
  label: string;
  sublabel: string;
  start: Date;
  end: Date;
};

function buildTimelineColumns(rangeStart: Date, view: TimelineView) {
  const anchor = startOfMonth(rangeStart);

  if (view === "month") {
    const monthStart = startOfMonth(anchor);
    const monthEnd = endOfMonth(anchor);
    const totalDays = dayDiff(monthStart, monthEnd) + 1;

    return {
      label: monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      columnWidth: 72,
      columns: Array.from({ length: totalDays }, (_, index) => {
        const day = addDays(monthStart, index);
        return {
          key: day.toISOString(),
          label: day.toLocaleDateString("en-US", { day: "2-digit" }),
          sublabel: day.toLocaleDateString("en-US", { weekday: "short" }),
          start: day,
          end: day,
        };
      }),
    };
  }

  const monthCount = view === "three_years" ? 36 : 12;
  const columns = Array.from({ length: monthCount }, (_, index) => {
    const start = addMonths(anchor, index);
    const end = endOfMonth(start);
    return {
      key: `${start.getFullYear()}-${start.getMonth() + 1}`,
      label: start.toLocaleDateString("en-US", { month: "short" }),
      sublabel: start.toLocaleDateString("en-US", { year: "numeric" }),
      start,
      end,
    };
  });

  const first = columns[0];
  const last = columns.at(-1) as TimelineColumn;

  return {
    label:
      view === "three_years"
        ? `${first.start.getFullYear()} - ${last.end.getFullYear()}`
        : `${first.start.toLocaleDateString("en-US", { month: "short", year: "numeric" })} - ${last.end.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}`,
    columnWidth: 120,
    columns,
  };
}

function getTaskPlacement(task: Task, columns: TimelineColumn[]) {
  const taskStart = parseDate(task.startDate);
  const taskEnd = parseDate(task.endDate);

  const start = columns.findIndex(
    (column) =>
      taskStart.getTime() <= column.end.getTime() && taskEnd.getTime() >= column.start.getTime()
  );
  const end = findLastIndex(
    columns,
    (column) =>
      taskStart.getTime() <= column.end.getTime() && taskEnd.getTime() >= column.start.getTime()
  );

  if (start === -1 || end === -1 || start > end) {
    return null;
  }

  return { start, end };
}

function getMilestonePlacement(milestone: Milestone, columns: TimelineColumn[]) {
  return columns.findIndex((column) => {
    const milestoneDate = parseDate(milestone.eventDate);
    return milestoneDate.getTime() >= column.start.getTime() && milestoneDate.getTime() <= column.end.getTime();
  });
}

function findLastIndex<T>(values: T[], predicate: (value: T) => boolean) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index] as T)) {
      return index;
    }
  }

  return -1;
}

function CalendarBadge() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 9h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </svg>
    </span>
  );
}

export async function SummaryCard({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer?: string;
}) {
  const locale = await getLocale();
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-6">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Bot className="h-5 w-5" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{pickText(locale, "AI Summary", "AI 摘要")}</p>
      </div>
      <h3 className="font-serif text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{body}</p>
      {footer ? <p className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">{footer}</p> : null}
    </div>
  );
}

export async function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <div className="rounded-2xl border border-tertiary/20 bg-tertiary/5 p-4">
      <div className="flex items-center gap-2 text-tertiary">
        <HelpCircle className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{title}</p>
      </div>
      <div className="mt-2 text-sm text-secondary">{children ?? pickText(locale, "No detail yet.", "暂时还没有更多内容。")}</div>
    </div>
  );
}

function translateTaskStatus(status: string, locale: Awaited<ReturnType<typeof getLocale>>) {
  if (status === "in_progress") {
    return pickText(locale, "in progress", "进行中");
  }

  if (status === "done") {
    return pickText(locale, "done", "已完成");
  }

  return pickText(locale, "pending", "待开始");
}

function translateActorRole(role: string, locale: Awaited<ReturnType<typeof getLocale>>) {
  if (role === "admin") {
    return pickText(locale, "admin", "管理员");
  }

  if (role === "consultant") {
    return pickText(locale, "consultant", "顾问");
  }

  if (role === "parent") {
    return pickText(locale, "parent", "家长");
  }

  return pickText(locale, "student", "学生");
}
