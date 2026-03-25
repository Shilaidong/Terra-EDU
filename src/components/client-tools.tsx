"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { useText } from "@/components/locale-provider";
import { avatarPresets } from "@/lib/avatar-presets";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { shouldUseBrowserSupabaseAuth } from "@/lib/supabase/shared";
import { cn } from "@/lib/utils";
import type { ApiResponse, CheckInRecord, ContentItem, Milestone, Task, TimelineLane, UserRole } from "@/lib/types";

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export function LoginForm() {
  const t = useText();
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("student@terra.edu");
  const [password, setPassword] = useState("terra123");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");

        try {
          if (shouldUseBrowserSupabaseAuth() && supabase) {
            const { error: supabaseError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (supabaseError) {
              throw new Error(supabaseError.message);
            }
          }

          await jsonFetch<{ redirectTo: string }>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role }),
          });

          router.push(
            role === "student"
              ? "/student/dashboard"
              : role === "parent"
                ? "/parent/dashboard"
                : "/consultant/students"
          );
          router.refresh();
        } catch (submissionError) {
          if (shouldUseBrowserSupabaseAuth() && supabase) {
            await supabase.auth.signOut();
          }
          setError(submissionError instanceof Error ? submissionError.message : t("Login failed", "登录失败"));
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        {(["student", "parent", "consultant"] as UserRole[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setRole(item);
              setEmail(`${item}@terra.edu`);
              setPassword("terra123");
            }}
            className={
              role === item
                ? "rounded-2xl border-2 border-primary bg-primary/5 p-3 text-center text-sm font-bold text-primary"
                : "rounded-2xl border border-outline-variant bg-white p-3 text-center text-sm font-bold text-secondary"
            }
          >
            {translateRole(item, t)}
          </button>
        ))}
      </div>

      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        placeholder={t("Email address", "邮箱地址")}
        className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 focus:outline-primary"
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder={t("Password", "密码")}
        className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 focus:outline-primary"
      />
      <button
        disabled={pending}
        className="terra-on-primary w-full rounded-2xl bg-primary px-5 py-3 text-lg font-bold text-white disabled:opacity-70"
      >
        {pending ? t("Signing in...", "登录中...") : t("Sign In", "登录")}
      </button>
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
    </form>
  );
}

export function LogoutButton() {
  const t = useText();
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          if (supabase) {
            await supabase.auth.signOut();
          }
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
        });
      }}
      className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary"
    >
      {t("Sign Out", "退出登录")}
    </button>
  );
}

export function TaskStatusControl({
  taskId,
  status,
  endpointBase = "/api/student/tasks",
}: {
  taskId: string;
  status: Task["status"];
  endpointBase?: string;
}) {
  const t = useText();
  const [value, setValue] = useState(status);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={async (event) => {
        const nextValue = event.target.value as Task["status"];
        setValue(nextValue);
        setPending(true);

        try {
          await jsonFetch(`${endpointBase}/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextValue }),
          });
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
      className="rounded-full border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-secondary"
    >
      <option value="pending">{t("pending", "待开始")}</option>
      <option value="in_progress">{t("in progress", "进行中")}</option>
      <option value="done">{t("done", "已完成")}</option>
    </select>
  );
}

const timelineLaneOptions: {
  value: TimelineLane;
  label: { en: string; zh: string };
  helper: { en: string; zh: string };
}[] = [
  {
    value: "standardized_exams",
    label: { en: "Standardized Exams", zh: "标化考试" },
    helper: { en: "IELTS, TOEFL, SAT, AP and similar score planning.", zh: "用于 IELTS、TOEFL、SAT、AP 等考试规划。" },
  },
  {
    value: "application_progress",
    label: { en: "Application Progress", zh: "申请进度" },
    helper: { en: "Essays, forms, interviews, and school application steps.", zh: "用于文书、表格、面试和学校申请进度。" },
  },
  {
    value: "activities",
    label: { en: "Activities", zh: "活动安排" },
    helper: { en: "Clubs, volunteering, research, and profile building.", zh: "用于社团、志愿服务、科研和背景提升。" },
  },
  {
    value: "competitions",
    label: { en: "Competitions", zh: "竞赛安排" },
    helper: { en: "Olympiads, showcases, hackathons, and contests.", zh: "用于奥赛、展示、黑客松和各类比赛。" },
  },
];

function translateRole(role: UserRole, t: ReturnType<typeof useText>) {
  if (role === "parent") return t("parent", "家长");
  if (role === "consultant") return t("consultant", "顾问");
  return t("student", "学生");
}

function translateConsultantTemplate(label: string, t: ReturnType<typeof useText>) {
  if (label === "Deadline Prep") return t("Deadline Prep", "截止日准备");
  if (label === "Exam Sprint") return t("Exam Sprint", "考试冲刺");
  if (label === "Activity Checkpoint") return t("Activity Checkpoint", "活动检查点");
  return t("Essay Review", "文书审阅");
}

function getTodayString() {
  return formatDateForInput(new Date());
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
}

function formatDateForInput(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

export function StudentTimelineTaskComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const today = getTodayString();
  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("Book the next IELTS mock exam");
  const [description, setDescription] = useState(
    "Choose the next mock test date, reserve the slot, and plan the score review."
  );
  const [timelineLane, setTimelineLane] = useState<TimelineLane>("standardized_exams");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 7));
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <div className="h-12 rounded-2xl bg-surface-container-low" />
          <div className="h-24 rounded-2xl bg-surface-container-low" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-2xl bg-surface-container-low" />
          <div className="h-20 rounded-2xl bg-surface-container-low" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-2xl bg-surface-container-low" />
          <div className="h-20 rounded-2xl bg-surface-container-low" />
        </div>
        <div className="mt-4 h-12 rounded-full bg-surface-container-low" />
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();

        if (endDate < startDate) {
          setMessage(t("End date needs to be on or after the start date.", "结束日期不能早于开始日期。"));
          return;
        }

        setPending(true);
        setMessage("");

        try {
          await jsonFetch("/api/student/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              title,
              description,
              timelineLane,
              startDate,
              endDate,
              priority,
            }),
          });
          setMessage(t("Timeline task added.", "时间线任务已添加。"));
          setTitle("");
          setDescription("");
          setTimelineLane("application_progress");
          setStartDate(today);
          setEndDate(addDays(today, 7));
          setPriority("Medium");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : t("Failed to add task.", "添加任务失败。"));
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Timeline task title", "时间线任务标题")}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Describe the outcome for this task", "描述这个任务的目标与结果")}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Timeline lane", "时间线分类")}
          <select
            value={timelineLane}
            onChange={(event) => setTimelineLane(event.target.value as TimelineLane)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            {timelineLaneOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.label.en, item.label.zh)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Priority", "优先级")}
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Task["priority"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="Low">{t("Low", "低")}</option>
            <option value="Medium">{t("Medium", "中")}</option>
            <option value="High">{t("High", "高")}</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Start date", "开始日期")}
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("End date", "结束日期")}
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-secondary">
        {(() => {
          const matchedLane = timelineLaneOptions.find((item) => item.value === timelineLane);
          return matchedLane ? t(matchedLane.helper.en, matchedLane.helper.zh) : null;
        })()}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {pending ? t("Adding...", "添加中...") : t("Add Timeline Task", "添加时间线任务")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function TaskDeleteButton({
  taskId,
  title,
  endpointBase = "/api/student/tasks",
}: {
  taskId: string;
  title: string;
  endpointBase?: string;
}) {
  const t = useText();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(t(`Delete "${title}" from the timeline?`, `确定从时间线中删除“${title}”吗？`))) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${taskId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : t("Delete failed", "删除失败"));
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? t("Deleting...", "删除中...") : t("Delete", "删除")}
      </button>
      {message ? <span className="text-xs font-semibold text-error">{message}</span> : null}
    </div>
  );
}

export function StudentMilestoneComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const [title, setTitle] = useState("Application payment deadline");
  const [eventDate, setEventDate] = useState(getTodayString());
  const [status, setStatus] = useState<Milestone["status"]>("upcoming");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");

        try {
          await jsonFetch("/api/student/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              title,
              eventDate,
              status,
            }),
          });
          setMessage(t("Milestone added.", "截止日期已添加。"));
          setTitle("");
          setEventDate(getTodayString());
          setStatus("upcoming");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : t("Failed to add milestone.", "添加截止日期失败。"));
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Milestone title", "截止日期标题")}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Date", "日期")}
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Status", "状态")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="upcoming">{t("upcoming", "待开始")}</option>
            <option value="done">{t("done", "已完成")}</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-secondary">
        {t(
          "Milestones are tracked as deadlines only, so this section stays focused and easy to maintain.",
          "里程碑这里只记录截止日期，维护会更简单。"
        )}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {pending ? t("Adding...", "添加中...") : t("Add Milestone", "添加截止日期")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function MilestoneEditorControls({
  milestone,
  endpointBase = "/api/student/milestones",
}: {
  milestone: Pick<Milestone, "id" | "title" | "eventDate" | "status">;
  endpointBase?: string;
}) {
  const t = useText();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [eventDate, setEventDate] = useState(milestone.eventDate);
  const [status, setStatus] = useState<Milestone["status"]>(milestone.status);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (isEditing) {
    return (
      <form
        className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${milestone.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, eventDate, status }),
            });
            setIsEditing(false);
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : t("Update failed", "更新失败"));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Deadline title", "截止日期标题")}
          />
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="upcoming">{t("upcoming", "待开始")}</option>
            <option value="done">{t("done", "已完成")}</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? t("Saving...", "保存中...") : t("Save", "保存")}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setTitle(milestone.title);
              setEventDate(milestone.eventDate);
              setStatus(milestone.status);
              setMessage("");
            }}
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary"
          >
            {t("Cancel", "取消")}
          </button>
          {message ? <p className="text-sm font-semibold text-error">{message}</p> : null}
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-full border border-outline-variant px-3 py-2 text-sm font-semibold text-primary"
      >
        {t("Edit", "编辑")}
      </button>
      <MilestoneDeleteButton milestoneId={milestone.id} title={milestone.title} endpointBase={endpointBase} />
    </div>
  );
}

export function MilestoneDeleteButton({
  milestoneId,
  title,
  endpointBase = "/api/student/milestones",
}: {
  milestoneId: string;
  title: string;
  endpointBase?: string;
}) {
  const t = useText();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(t(`Delete "${title}"?`, `确定删除“${title}”吗？`))) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${milestoneId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : t("Delete failed", "删除失败"));
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? t("Deleting...", "删除中...") : t("Delete", "删除")}
      </button>
      {message ? <span className="text-xs font-semibold text-error">{message}</span> : null}
    </div>
  );
}

export function CheckInComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const [curriculum, setCurriculum] = useState("AP Biology");
  const [chapter, setChapter] = useState("Ecology");
  const [mastery, setMastery] = useState(4);
  const [notes, setNotes] = useState("Need more timed practice on free response questions.");
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch("/api/student/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, curriculum, chapter, mastery, notes }),
        });
        setMessage(t("Check-in saved with trace logging.", "打卡已保存，并记录日志。"));
        router.refresh();
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={curriculum}
          onChange={(event) => setCurriculum(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Curriculum", "课程")}
        />
        <input
          value={chapter}
          onChange={(event) => setChapter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Chapter", "章节")}
        />
      </div>
      <label className="text-sm font-semibold text-secondary">
        {t("Mastery", "掌握度")}: {mastery}/5
        <input
          type="range"
          min={1}
          max={5}
          value={mastery}
          onChange={(event) => setMastery(Number(event.target.value))}
          className="mt-2 w-full accent-primary"
        />
      </label>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="min-h-28 rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t("Save Check-in", "保存打卡")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function CheckInEditorControls({
  checkIn,
  endpointBase = "/api/student/checkins",
}: {
  checkIn: Pick<CheckInRecord, "id" | "curriculum" | "chapter" | "mastery" | "date" | "notes">;
  endpointBase?: string;
}) {
  const t = useText();
  const [isEditing, setIsEditing] = useState(false);
  const [curriculum, setCurriculum] = useState(checkIn.curriculum);
  const [chapter, setChapter] = useState(checkIn.chapter);
  const [mastery, setMastery] = useState(checkIn.mastery);
  const [date, setDate] = useState(checkIn.date);
  const [notes, setNotes] = useState(checkIn.notes);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (isEditing) {
    return (
      <form
        className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${checkIn.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                curriculum,
                chapter,
                mastery,
                date,
                notes,
              }),
            });
            setIsEditing(false);
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : t("Update failed", "更新失败"));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={curriculum}
            onChange={(event) => setCurriculum(event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Curriculum", "课程")}
          />
          <input
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Chapter", "章节")}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-secondary">
            {t("Date", "日期")}
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
            />
          </label>
          <label className="text-sm font-semibold text-secondary">
            {t("Mastery", "掌握度")}: {mastery}/5
            <input
              type="range"
              min={1}
              max={5}
              value={mastery}
              onChange={(event) => setMastery(Number(event.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-3 min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? t("Saving...", "保存中...") : t("Save", "保存")}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setCurriculum(checkIn.curriculum);
              setChapter(checkIn.chapter);
              setMastery(checkIn.mastery);
              setDate(checkIn.date);
              setNotes(checkIn.notes);
              setMessage("");
            }}
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary"
          >
            {t("Cancel", "取消")}
          </button>
          {message ? <p className="text-sm font-semibold text-error">{message}</p> : null}
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-full border border-outline-variant px-3 py-2 text-sm font-semibold text-primary"
      >
        {t("Edit", "编辑")}
      </button>
      <CheckInDeleteButton
        checkInId={checkIn.id}
        title={`${checkIn.curriculum} · ${checkIn.chapter}`}
        endpointBase={endpointBase}
      />
    </div>
  );
}

export function CheckInDeleteButton({
  checkInId,
  title,
  endpointBase = "/api/student/checkins",
}: {
  checkInId: string;
  title: string;
  endpointBase?: string;
}) {
  const t = useText();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(t(`Delete "${title}"?`, `确定删除“${title}”吗？`))) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${checkInId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : t("Delete failed", "删除失败"));
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? t("Deleting...", "删除中...") : t("Delete", "删除")}
      </button>
      {message ? <span className="text-xs font-semibold text-error">{message}</span> : null}
    </div>
  );
}

export function StudentProfileEditor({
  studentId,
  defaultName,
  defaultGrade,
  defaultSchool,
  defaultCountries,
  defaultDreamSchools,
  defaultMajor,
  defaultAvatar,
}: {
  studentId: string;
  defaultName: string;
  defaultGrade: string;
  defaultSchool: string;
  defaultCountries: string[];
  defaultDreamSchools: string[];
  defaultMajor: string;
  defaultAvatar: string;
}) {
  const t = useText();
  const [name, setName] = useState(defaultName);
  const [grade, setGrade] = useState(defaultGrade);
  const [schoolName, setSchoolName] = useState(defaultSchool);
  const [countries, setCountries] = useState(defaultCountries.join(", "));
  const [schools, setSchools] = useState(defaultDreamSchools.join(", "));
  const [major, setMajor] = useState(defaultMajor);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch("/api/student/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            name,
            grade,
            school: schoolName,
            targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean),
            dreamSchools: schools.split(",").map((value) => value.trim()).filter(Boolean),
            intendedMajor: major,
            avatar,
          }),
        });
        setMessage(t("Profile basics and goals updated.", "个人资料和目标已更新。"));
        router.refresh();
      }}
    >
      <div>
        <p className="text-sm font-semibold text-secondary">{t("Avatar", "头像")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {avatarPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setAvatar(preset.value)}
              className={cn(
                "flex items-center justify-center rounded-3xl border bg-white p-4 transition-all",
                avatar === preset.value
                  ? "border-primary shadow-terra ring-2 ring-primary/20"
                  : "border-black/5 hover:border-primary/30"
              )}
              aria-label={preset.label}
            >
              <img alt={preset.label} src={preset.value} className="h-24 w-24 rounded-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Your full name", "你的姓名")}
      />
      <input
        value={grade}
        onChange={(event) => setGrade(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Current grade", "当前年级")}
      />
      <input
        value={schoolName}
        onChange={(event) => setSchoolName(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Current school", "当前学校")}
      />
      <input
        value={countries}
        onChange={(event) => setCountries(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Target countries", "目标国家")}
      />
      <input
        value={schools}
        onChange={(event) => setSchools(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Dream schools", "梦校")}
      />
      <input
        value={major}
        onChange={(event) => setMajor(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Intended major", "意向专业")}
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t("Save Profile", "保存资料")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ParentProfileEditor({
  userId,
  defaultName,
  defaultAvatar,
}: {
  userId: string;
  defaultName: string;
  defaultAvatar: string;
}) {
  const t = useText();
  const [name, setName] = useState(defaultName);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch("/api/parent/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name,
            avatar,
          }),
        });
        setMessage(t("Parent profile updated.", "家长资料已更新。"));
        router.refresh();
      }}
    >
      <div>
        <p className="text-sm font-semibold text-secondary">{t("Avatar", "头像")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {avatarPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setAvatar(preset.value)}
              className={cn(
                "flex items-center justify-center rounded-3xl border bg-white p-4 transition-all",
                avatar === preset.value
                  ? "border-primary shadow-terra ring-2 ring-primary/20"
                  : "border-black/5 hover:border-primary/30"
              )}
              aria-label={preset.label}
            >
              <img alt={preset.label} src={preset.value} className="h-24 w-24 rounded-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Your display name", "你的显示名称")}
      />

      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t("Save Profile", "保存资料")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function AiRecommendationPanel({
  studentId,
  page,
  feature,
  prompt,
}: {
  studentId: string;
  page: string;
  feature: string;
  prompt: string;
}) {
  const t = useText();
  const [result, setResult] = useState<null | {
    summary: string;
    recommendations: string[];
    sources: string[];
    trace_id: string;
    decision_id: string;
  }>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("AI Recommendation", "AI 推荐")}</p>
          <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">{t("Practical launch AI", "可落地的 AI 助手")}</h3>
          <p className="mt-3 text-sm leading-7 text-secondary">
            {t(
              "Generates recommendation summaries, logs the prompt version, and stores traceable artifacts for later bug fixing.",
              "会生成建议摘要、记录提示词版本，并保存可追踪结果，方便后续排查和修复。"
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              const payload = await jsonFetch<{
                summary: string;
                recommendations: string[];
                sources: string[];
                trace_id: string;
                decision_id: string;
              }>("/api/ai/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, page, feature, prompt }),
              });
              setResult(payload.data ?? null);
              router.refresh();
            } finally {
              setPending(false);
            }
          }}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
        >
          {pending ? t("Thinking...", "生成中...") : t("Generate", "生成")}
        </button>
      </div>

      {result ? (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm leading-7 text-secondary">{result.summary}</p>
          <ul className="mt-4 space-y-2">
            {result.recommendations.map((item) => (
              <li key={item} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">
            trace_id: {result.trace_id} · decision_id: {result.decision_id}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AiChatWidget({ studentId }: { studentId: string }) {
  const t = useText();
  const [question, setQuestion] = useState("What should I prioritize this week?");
  const [answer, setAnswer] = useState("");
  const [trace, setTrace] = useState("");

  return (
    <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-terra">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("AI Assistant", "AI 助手")}</p>
      <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">{t("Question-driven support", "问题驱动的支持")}</h3>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-4 min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <button
        type="button"
        onClick={async () => {
          const payload = await jsonFetch<{
            summary: string;
            trace_id: string;
            decision_id: string;
          }>("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, question }),
          });

          setAnswer(payload.data?.summary ?? "");
          setTrace(`${payload.trace_id} · ${payload.data?.decision_id ?? ""}`);
        }}
        className="mt-4 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
      >
        {t("Ask AI", "向 AI 提问")}
      </button>
      {answer ? (
        <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-sm leading-7 text-secondary">
          <p>{answer}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-outline">{trace}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ConsultantTaskComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const today = getTodayString();
  const taskTemplates: {
    label: string;
    title: string;
    description: string;
    timelineLane: TimelineLane;
    priority: Task["priority"];
    durationDays: number;
  }[] = [
    {
      label: "Essay Review",
      title: "Run essay revision review",
      description: "Lock the advisor review slot, collect the latest draft, and return targeted comments.",
      timelineLane: "application_progress",
      priority: "High",
      durationDays: 4,
    },
    {
      label: "Deadline Prep",
      title: "Prepare deadline submission pack",
      description: "Verify documents, portal uploads, and payment steps before the deadline window closes.",
      timelineLane: "application_progress",
      priority: "High",
      durationDays: 5,
    },
    {
      label: "Exam Sprint",
      title: "Launch standardized exam sprint",
      description: "Set the mock exam date, review weak sections, and confirm score reporting readiness.",
      timelineLane: "standardized_exams",
      priority: "Medium",
      durationDays: 7,
    },
    {
      label: "Activity Checkpoint",
      title: "Review activity progress checkpoint",
      description: "Confirm leadership, research, or service progress and capture evidence for the profile build.",
      timelineLane: "activities",
      priority: "Medium",
      durationDays: 6,
    },
  ];
  const [title, setTitle] = useState("Schedule final essay review");
  const [description, setDescription] = useState("Lock the advisor review slot and collect the latest draft.");
  const [timelineLane, setTimelineLane] = useState<TimelineLane>("application_progress");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 5));
  const [priority, setPriority] = useState<Task["priority"]>("High");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (endDate < startDate) {
          setMessage(t("End date needs to be on or after the start date.", "结束日期不能早于开始日期。"));
          return;
        }

        setPending(true);
        setMessage("");

        try {
          await jsonFetch("/api/consultant/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              title,
              description,
              timelineLane,
              startDate,
              endDate,
              priority,
            }),
          });
          setMessage(t("Task created and audit logged.", "任务已创建，并写入审计日志。"));
          setTitle("");
          setDescription("");
          setTimelineLane("application_progress");
          setStartDate(today);
          setEndDate(addDays(today, 5));
          setPriority("High");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : t("Task creation failed.", "任务创建失败。"));
        } finally {
          setPending(false);
        }
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Task title", "任务标题")}
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <div className="flex flex-wrap gap-2">
        {taskTemplates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => {
              setTitle(template.title);
              setDescription(template.description);
              setTimelineLane(template.timelineLane);
              setPriority(template.priority);
              setStartDate(today);
              setEndDate(addDays(today, template.durationDays));
              setMessage(t(`Loaded ${template.label.toLowerCase()} template.`, `已载入${translateConsultantTemplate(template.label, t)}模板。`));
            }}
            className="rounded-full border border-outline-variant px-3 py-2 text-xs font-bold text-primary"
          >
            {translateConsultantTemplate(template.label, t)}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Timeline lane", "时间线分类")}
          <select
            value={timelineLane}
            onChange={(event) => setTimelineLane(event.target.value as TimelineLane)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            {timelineLaneOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.label.en, item.label.zh)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Priority", "优先级")}
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Task["priority"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="Low">{t("Low", "低")}</option>
            <option value="Medium">{t("Medium", "中")}</option>
            <option value="High">{t("High", "高")}</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Start date", "开始日期")}
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("End date", "结束日期")}
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70">
          {pending ? t("Adding...", "添加中...") : t("Add Task", "添加任务")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ConsultantMilestoneComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const [title, setTitle] = useState("Application fee deadline");
  const [eventDate, setEventDate] = useState(getTodayString());
  const [status, setStatus] = useState<Milestone["status"]>("upcoming");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");

        try {
          await jsonFetch("/api/consultant/milestones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, title, eventDate, status }),
          });
          setMessage(t("Deadline created.", "截止日期已创建。"));
          setTitle("");
          setEventDate(getTodayString());
          setStatus("upcoming");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : t("Deadline creation failed.", "截止日期创建失败。"));
        } finally {
          setPending(false);
        }
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Deadline title", "截止日期标题")}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Date", "日期")}
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Status", "状态")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="upcoming">{t("upcoming", "待开始")}</option>
            <option value="done">{t("done", "已完成")}</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70">
          {pending ? t("Adding...", "添加中...") : t("Add Deadline", "添加截止日期")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ConsultantStudentProfileEditor({
  studentId,
  defaultGrade,
  defaultSchool,
  defaultCountries,
  defaultDreamSchools,
  defaultMajor,
}: {
  studentId: string;
  defaultGrade: string;
  defaultSchool: string;
  defaultCountries: string[];
  defaultDreamSchools: string[];
  defaultMajor: string;
}) {
  const t = useText();
  const [grade, setGrade] = useState(defaultGrade);
  const [schoolName, setSchoolName] = useState(defaultSchool);
  const [countries, setCountries] = useState(defaultCountries.join(", "));
  const [schools, setSchools] = useState(defaultDreamSchools.join(", "));
  const [major, setMajor] = useState(defaultMajor);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch(`/api/consultant/students/${studentId}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade,
            school: schoolName,
            targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean),
            dreamSchools: schools.split(",").map((value) => value.trim()).filter(Boolean),
            intendedMajor: major,
          }),
        });
        setMessage(t("Student profile updated.", "学生资料已更新。"));
        router.refresh();
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Current grade", "当前年级")} />
        <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Current school", "当前学校")} />
      </div>
      <input value={countries} onChange={(event) => setCountries(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Target countries", "目标国家")} />
      <input value={schools} onChange={(event) => setSchools(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Dream schools", "梦校")} />
      <input value={major} onChange={(event) => setMajor(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Intended major", "意向专业")} />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">{t("Save Student Profile", "保存学生资料")}</button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ConsultantNoteComposer({ studentId }: { studentId: string }) {
  const t = useText();
  const [title, setTitle] = useState("Advisor follow-up");
  const [summary, setSummary] = useState("Needs a tighter deadline plan for essays and more consistent review rhythm.");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");

        try {
          await jsonFetch("/api/consultant/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, title, summary }),
          });
          setMessage(t("Advisor note saved.", "顾问备注已保存。"));
          setTitle("");
          setSummary("");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : t("Note creation failed.", "备注创建失败。"));
        } finally {
          setPending(false);
        }
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Note title", "备注标题")}
      />
      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        className="min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Consultant note summary", "顾问备注摘要")}
      />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70">
          {pending ? t("Saving...", "保存中...") : t("Add Note", "添加备注")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ConsultantStudentPicker({
  students,
  currentStudentId,
}: {
  students: {
    id: string;
    name: string;
    grade: string;
    school: string;
    completion: number;
    phase: string;
    riskLevel: "low" | "medium" | "high";
    riskScore: number;
    nextDeadlineLabel: string;
    nextDeadlineTitle: string;
    nextDeadlineDate: string | null;
  }[];
  currentStudentId: string;
}) {
  const t = useText();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"risk" | "deadline" | "completion" | "name">("risk");
  const normalizedQuery = useDeferredValue(query).trim().toLowerCase();

  const filteredStudents = students
    .filter((student) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        student.name,
        student.grade,
        student.school,
        student.phase,
        student.riskLevel,
        student.nextDeadlineTitle,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => {
      if (sortBy === "risk") {
        return right.riskScore - left.riskScore || right.completion - left.completion;
      }

      if (sortBy === "deadline") {
        const leftDate = left.nextDeadlineDate ?? "9999-12-31";
        const rightDate = right.nextDeadlineDate ?? "9999-12-31";
        return leftDate.localeCompare(rightDate) || right.riskScore - left.riskScore;
      }

      if (sortBy === "completion") {
        return left.completion - right.completion || right.riskScore - left.riskScore;
      }

      return left.name.localeCompare(right.name);
    });

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Search students", "搜索学生")}
      />
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: "risk", label: t("By Risk", "按风险") },
          { value: "deadline", label: t("By Deadline", "按截止日") },
          { value: "completion", label: t("By Progress", "按进度") },
          { value: "name", label: "A-Z" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSortBy(option.value as typeof sortBy)}
            className={cn(
              "rounded-2xl px-3 py-2 text-sm font-semibold",
              sortBy === option.value
                ? "bg-primary/10 text-primary"
                : "bg-surface-container-low text-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <a
            key={student.id}
            href={`/consultant/students/${student.id}`}
            className={cn(
              "block rounded-2xl border px-4 py-4 transition-all",
              student.id === currentStudentId
                ? "border-primary bg-primary/5 shadow-terra"
                : "border-black/5 bg-white hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-foreground">{student.name}</p>
                <p className="mt-1 text-sm text-secondary">
                  {student.grade} · {student.school}
                </p>
              </div>
              <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-primary">
                {student.completion}%
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
                  student.riskLevel === "high"
                    ? "bg-error/10 text-error"
                    : student.riskLevel === "medium"
                      ? "bg-tertiary/15 text-tertiary"
                      : "bg-primary/10 text-primary"
                )}
              >
                {student.riskLevel === "high"
                  ? t("high risk", "高风险")
                  : student.riskLevel === "medium"
                    ? t("medium risk", "中风险")
                    : t("low risk", "低风险")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                {student.phase}
              </span>
            </div>
            <div className="mt-3 rounded-2xl bg-surface-container-low px-3 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Next deadline", "下一个截止日期")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{student.nextDeadlineTitle}</p>
              <p className="mt-1 text-xs text-secondary">{student.nextDeadlineLabel}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ContentItemComposer() {
  const t = useText();
  const [title, setTitle] = useState("Global Sustainability Lab");
  const [subtitle, setSubtitle] = useState("Project-based environmental research");
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch("/api/content/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "competition",
            title,
            subtitle,
            country: "Global",
            tags: ["Research", "Sustainability"],
            difficulty: "Match",
            status: "draft",
          }),
        });
        setMessage(t("Manual content item created.", "内容条目已创建。"));
        router.refresh();
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Title", "标题")}
      />
      <input
        value={subtitle}
        onChange={(event) => setSubtitle(event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Subtitle", "副标题")}
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t("Create Content", "创建内容")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ContentImportPanel() {
  const t = useText();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/content/import", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as ApiResponse<{ count: number }>;
        if (!response.ok || !payload.success) {
          setMessage(payload.message);
          return;
        }
        setMessage(
          t(
            `Imported ${payload.data?.count ?? 0} items with audit logging.`,
            `已导入 ${payload.data?.count ?? 0} 条内容，并写入审计日志。`
          )
        );
        router.refresh();
      }}
    >
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
        {t("Import Spreadsheet", "导入表格")}
      </button>
      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
    </form>
  );
}

export function AnalyticsExportButton() {
  const t = useText();
  const [message, setMessage] = useState("");

  return (
    <div className="flex items-center gap-3">
      <a
        href="/api/analytics/report"
        className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
        onClick={() => setMessage(t("Downloading cohort analytics report...", "正在下载顾问分析报表..."))}
      >
        {t("Export Report", "导出报表")}
      </a>
      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
    </div>
  );
}

export function ContentFilterTable({ items }: { items: ContentItem[] }) {
  const t = useText();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredItems = items.filter((item) =>
    `${item.title} ${item.subtitle} ${item.tags.join(" ")}`
      .toLowerCase()
      .includes(deferredQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Filter content, majors, or schools...", "筛选内容、专业或学校...")}
      />
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-secondary">
            <tr>
              <th className="px-4 py-3">{t("Title", "标题")}</th>
              <th className="px-4 py-3">{t("Type", "类型")}</th>
              <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
              <th className="px-4 py-3">{t("Source", "来源")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-t border-black/5">
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-secondary">{item.subtitle}</p>
                </td>
                <td className="px-4 py-3 capitalize text-secondary">{item.type}</td>
                <td className="px-4 py-3">{item.difficulty}</td>
                <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
