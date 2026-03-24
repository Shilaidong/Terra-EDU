/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Bell, Bot, BookOpenText, Compass, FileText, FolderOpen, HelpCircle, LayoutDashboard, LifeBuoy, LineChart, MessageCircle, NotebookPen, PiggyBank, Settings, Shield, Sparkles, Users } from "lucide-react";

import { roleNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { AuditLog, Milestone, SessionPayload, Task, TimelineLane, TimelineView, UserRole } from "@/lib/types";

const iconMap = {
  Dashboard: LayoutDashboard,
  Timeline: NotebookPen,
  "Check-ins": BookOpenText,
  Explore: Compass,
  Settings,
  Applications: FileText,
  Documents: FolderOpen,
  Messages: MessageCircle,
  Finances: PiggyBank,
  Support: LifeBuoy,
  Students: Users,
  Content: BookOpenText,
  Analytics: LineChart,
};

function NavIcon({ label }: { label: string }) {
  const Icon = iconMap[label as keyof typeof iconMap] ?? Sparkles;
  return <Icon className="h-4 w-4" />;
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-6 pb-14 pt-24">{children}</div>;
}

export function RoleShell({
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
  const navItems = roleNav[session.role];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/5 bg-[#faf6f0]/90 px-6 backdrop-blur">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl font-bold text-primary">
            Terra Edu
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
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm text-secondary md:flex">
            <Bell className="h-4 w-4 text-primary" />
            Full trace logging enabled
          </div>
          <img
            alt={session.name}
            src={session.avatar ?? getAvatarForRole(session.role)}
            className="h-10 w-10 rounded-full border border-outline-variant object-cover"
          />
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
                  {session.role} portal
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
              <NavIcon label={item.label} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 px-6 py-6">
          <div className="rounded-2xl bg-primary p-4 text-white shadow-terra">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              <Shield className="h-4 w-4" />
              Observability
            </div>
            <p className="mt-2 text-sm text-white/85">
              Every write action stores `trace_id`, `decision_id`, actor, latency, and result.
            </p>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <PageContainer>
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground">{title}</h1>
              <p className="mt-2 max-w-3xl text-secondary">{subtitle}</p>
            </div>
            {hero}
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
    <div className="rounded-2xl border border-primary/10 bg-white/90 px-5 py-4 shadow-terra">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {icon}
        {title}
      </div>
      <div className="font-serif text-3xl font-bold text-primary">{value}</div>
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
    <section className={cn("rounded-3xl bg-surface-container-lowest p-6 shadow-terra", className)}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{eyebrow}</p>
          ) : null}
          <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
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
    <div className="rounded-3xl border border-black/5 bg-surface-container-lowest p-6 shadow-terra">
      <div className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]", styles)}>
        {label}
      </div>
      <div className="mt-4 font-serif text-4xl font-bold text-foreground">{value}</div>
      <p className="mt-3 text-sm text-secondary">{hint}</p>
    </div>
  );
}

export function TaskList({
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
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        No timeline tasks yet. Add your first item above and it will appear here immediately.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-2xl border border-black/5 bg-surface-container-low px-5 py-4 transition-colors hover:border-primary/30"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{task.title}</h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {task.timelineLane ? getLaneLabel(task.timelineLane) : task.category}
                </span>
                <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs font-bold text-tertiary">
                  {task.priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-secondary">{task.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                {task.startDate && task.endDate ? (
                  <span>{formatTaskRange(task.startDate, task.endDate)}</span>
                ) : null}
                <span>{task.dueLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary shadow-sm">
                {task.status}
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
  label: string;
  subtitle: string;
  barClassName: string;
  markerClassName: string;
}[] = [
  {
    lane: "standardized_exams",
    label: "Standardized Exams",
    subtitle: "Scores and test readiness",
    barClassName: "bg-primary-container/45 border border-primary/20 text-[#2a6038]",
    markerClassName: "bg-primary",
  },
  {
    lane: "application_progress",
    label: "Applications",
    subtitle: "Essays, forms, and interviews",
    barClassName: "bg-secondary-container border border-secondary/20 text-[#4a4538]",
    markerClassName: "bg-tertiary",
  },
  {
    lane: "activities",
    label: "Extracurriculars",
    subtitle: "Leadership, research, and service",
    barClassName: "bg-tertiary-fixed-dim/20 border border-tertiary/10 text-[#554020]",
    markerClassName: "bg-tertiary-container",
  },
  {
    lane: "competitions",
    label: "Competitions",
    subtitle: "Challenges and showcases",
    barClassName: "bg-primary/10 border border-primary/15 text-primary",
    markerClassName: "bg-primary-fixed-dim",
  },
];

export function TaskGanttChart({
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
  if (tasks.length === 0 && milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        Add a timeline task or deadline to generate the gantt view.
      </div>
    );
  }

  const timeline = buildTimelineColumns(rangeStart, view);
  const minWidth = 240 + timeline.columns.length * timeline.columnWidth;

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
      <div className="min-w-full" style={{ width: `${minWidth}px` }}>
        <div className="grid grid-cols-[240px_minmax(0,1fr)] border-b border-outline-variant/30">
          <div className="flex items-center gap-2 bg-surface-container-low px-6 py-5 text-sm font-bold text-primary">
            <CalendarBadge />
            {timeline.label}
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
                className="border-l border-outline-variant/20 px-3 py-4 text-center"
              >
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-outline">
                  {column.label}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-secondary">{column.sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {ganttLaneMeta.map((lane) => {
            const laneTasks = tasks.filter((task) => task.timelineLane === lane.lane);

            return (
              <div key={lane.lane} className="grid grid-cols-[240px_minmax(0,1fr)]">
                <div className="flex flex-col justify-center bg-white px-6 py-6">
                  <p className="font-bold text-primary">{lane.label}</p>
                  <p className="mt-1 text-xs text-secondary">{lane.subtitle}</p>
                </div>

                <div className="relative overflow-hidden bg-white px-0 py-3">
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
                    <div className="relative z-10 space-y-3 px-4">
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
                                  "relative h-9 rounded-full px-4 shadow-sm transition-colors hover:opacity-90",
                                  lane.barClassName
                                )}
                                style={{ gridColumn: `${placement.start + 1} / ${placement.end + 2}` }}
                              >
                                <div className="flex h-full items-center">
                                  <span className="truncate text-xs font-bold">{task.title}</span>
                                </div>
                                <div
                                  className={cn(
                                    "absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 rounded-[3px] shadow-sm",
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
                      <p className="col-span-full px-2 text-sm text-secondary">
                        No items scheduled in this lane yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex flex-col justify-center bg-white px-6 py-6">
              <p className="font-bold text-primary">Deadline</p>
              <p className="mt-1 text-xs text-secondary">Milestones and hard submission dates</p>
            </div>

            <div className="relative overflow-hidden bg-white px-0 py-3">
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
                <div className="relative z-10 space-y-3 px-4">
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
                            className="relative h-9 rounded-full border border-outline/20 bg-surface-container-highest px-4 text-on-surface-variant shadow-sm transition-colors hover:opacity-90"
                            style={{ gridColumn: `${placement + 1} / ${placement + 2}` }}
                          >
                            <div className="flex h-full items-center">
                              <span className="truncate text-xs font-bold">{milestone.title}</span>
                            </div>
                            <div className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-error shadow-sm" />
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
                  <p className="col-span-full px-2 text-sm text-secondary">
                    No deadlines scheduled in this calendar window yet.
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

export function TimelineRail({
  milestones,
  action,
}: {
  milestones: { id: string; title: string; dateLabel: string; eventDate?: string; status: string; type: string }[];
  action?: (milestoneId: string) => React.ReactNode;
}) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
        No milestones are scheduled inside this calendar window yet.
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
          <div className="ml-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-foreground">{milestone.title}</h3>
              <p className="mt-1 text-sm text-secondary">deadline</p>
              {action ? action(milestone.id) : null}
            </div>
            <div className="text-right">
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

export function AuditFeed({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-black/5 bg-surface-container-low p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-foreground">{log.action}</p>
              <p className="mt-1 text-sm text-secondary">
                {log.targetType} · {log.targetId}
              </p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.2em] text-outline">
              <p>{log.actorRole}</p>
              <p>{log.latencyMs}ms</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs text-secondary shadow-sm">
            <p>trace_id: {log.traceId}</p>
            <p>decision_id: {log.decisionId}</p>
            <p className="mt-2">{log.outputSummary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlaceholderCard({
  role,
  title,
  description,
}: {
  role: UserRole;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
      <SectionCard title={title} eyebrow="Launch-safe placeholder">
        <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8">
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-5 w-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">No dead links, clear next step</p>
          </div>
          <p className="mt-4 max-w-2xl text-secondary">{description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={role === "consultant" ? "/consultant/content" : `/${role}/dashboard`}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
            >
              Return to active workflow
            </Link>
            <Link
              href={role === "consultant" ? "/consultant/analytics" : `/${role}/settings`}
              className="rounded-full border border-outline-variant px-5 py-3 text-sm font-bold text-primary"
            >
              Review current setup
            </Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="What is already live" eyebrow="Today">
        <ul className="space-y-3 text-sm text-secondary">
          <li className="rounded-2xl bg-surface-container-low p-4">Role-based routing and protected sessions</li>
          <li className="rounded-2xl bg-surface-container-low p-4">Structured logs with `trace_id` and `decision_id`</li>
          <li className="rounded-2xl bg-surface-container-low p-4">Shared Terra design system for later AI bug fixing</li>
        </ul>
      </SectionCard>
    </div>
  );
}

function getAvatarForRole(role: UserRole) {
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
    <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-sm font-semibold text-secondary">
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

function getLaneLabel(lane: TimelineLane) {
  return ganttLaneMeta.find((item) => item.lane === lane)?.label ?? "Timeline";
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

export function SummaryCard({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer?: string;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-6">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Bot className="h-5 w-5" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">AI Summary</p>
      </div>
      <h3 className="font-serif text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{body}</p>
      {footer ? <p className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">{footer}</p> : null}
    </div>
  );
}

export function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-tertiary/20 bg-tertiary/5 p-4">
      <div className="flex items-center gap-2 text-tertiary">
        <HelpCircle className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">{title}</p>
      </div>
      <div className="mt-2 text-sm text-secondary">{children}</div>
    </div>
  );
}
