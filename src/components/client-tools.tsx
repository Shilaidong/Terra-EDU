"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

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
          setError(submissionError instanceof Error ? submissionError.message : "Login failed");
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
            {item}
          </button>
        ))}
      </div>

      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        placeholder="Email address"
        className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 focus:outline-primary"
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder="Password"
        className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 focus:outline-primary"
      />
      <button
        disabled={pending}
        className="w-full rounded-2xl bg-primary px-5 py-3 text-lg font-bold text-white disabled:opacity-70"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
    </form>
  );
}

export function LogoutButton() {
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
      Sign Out
    </button>
  );
}

export function TaskStatusControl({
  taskId,
  status,
}: {
  taskId: string;
  status: Task["status"];
}) {
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
          await jsonFetch(`/api/student/tasks/${taskId}`, {
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
      <option value="pending">pending</option>
      <option value="in_progress">in progress</option>
      <option value="done">done</option>
    </select>
  );
}

const timelineLaneOptions: {
  value: TimelineLane;
  label: string;
  helper: string;
}[] = [
  {
    value: "standardized_exams",
    label: "Standardized Exams",
    helper: "IELTS, TOEFL, SAT, AP and similar score planning.",
  },
  {
    value: "application_progress",
    label: "Application Progress",
    helper: "Essays, forms, interviews, and school application steps.",
  },
  {
    value: "activities",
    label: "Activities",
    helper: "Clubs, volunteering, research, and profile building.",
  },
  {
    value: "competitions",
    label: "Competitions",
    helper: "Olympiads, showcases, hackathons, and contests.",
  },
];

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
          setMessage("End date needs to be on or after the start date.");
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
          setMessage("Timeline task added.");
          setTitle("");
          setDescription("");
          setTimelineLane("application_progress");
          setStartDate(today);
          setEndDate(addDays(today, 7));
          setPriority("Medium");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : "Failed to add task.");
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
          placeholder="Timeline task title"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder="Describe the outcome for this task"
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          Timeline lane
          <select
            value={timelineLane}
            onChange={(event) => setTimelineLane(event.target.value as TimelineLane)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            {timelineLaneOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary">
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Task["priority"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-secondary">
        {timelineLaneOptions.find((item) => item.value === timelineLane)?.helper}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {pending ? "Adding..." : "Add Timeline Task"}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function TaskDeleteButton({
  taskId,
  title,
}: {
  taskId: string;
  title: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(`Delete "${title}" from the timeline?`)) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`/api/student/tasks/${taskId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : "Delete failed");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {message ? <span className="text-xs font-semibold text-error">{message}</span> : null}
    </div>
  );
}

export function StudentMilestoneComposer({ studentId }: { studentId: string }) {
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
          setMessage("Milestone added.");
          setTitle("");
          setEventDate(getTodayString());
          setStatus("upcoming");
          router.refresh();
        } catch (submissionError) {
          setMessage(submissionError instanceof Error ? submissionError.message : "Failed to add milestone.");
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
          placeholder="Milestone title"
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          Date
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="upcoming">upcoming</option>
            <option value="done">done</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-secondary">
        Milestones are tracked as deadlines only, so this section stays focused and easy to maintain.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {pending ? "Adding..." : "Add Milestone"}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function MilestoneEditorControls({
  milestone,
}: {
  milestone: Pick<Milestone, "id" | "title" | "eventDate" | "status">;
}) {
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
            await jsonFetch(`/api/student/milestones/${milestone.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, eventDate, status }),
            });
            setIsEditing(false);
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : "Update failed");
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
            placeholder="Deadline title"
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
            <option value="upcoming">upcoming</option>
            <option value="done">done</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? "Saving..." : "Save"}
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
            Cancel
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
        Edit
      </button>
      <MilestoneDeleteButton milestoneId={milestone.id} title={milestone.title} />
    </div>
  );
}

export function MilestoneDeleteButton({
  milestoneId,
  title,
}: {
  milestoneId: string;
  title: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(`Delete "${title}"?`)) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`/api/student/milestones/${milestoneId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : "Delete failed");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {message ? <span className="text-xs font-semibold text-error">{message}</span> : null}
    </div>
  );
}

export function CheckInComposer({ studentId }: { studentId: string }) {
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
        setMessage("Check-in saved with trace logging.");
        router.refresh();
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={curriculum}
          onChange={(event) => setCurriculum(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder="Curriculum"
        />
        <input
          value={chapter}
          onChange={(event) => setChapter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder="Chapter"
        />
      </div>
      <label className="text-sm font-semibold text-secondary">
        Mastery: {mastery}/5
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
          Save Check-in
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function CheckInEditorControls({
  checkIn,
}: {
  checkIn: Pick<CheckInRecord, "id" | "curriculum" | "chapter" | "mastery" | "date" | "notes">;
}) {
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
            await jsonFetch(`/api/student/checkins/${checkIn.id}`, {
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
            setMessage(submissionError instanceof Error ? submissionError.message : "Update failed");
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
            placeholder="Curriculum"
          />
          <input
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder="Chapter"
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-secondary">
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
            />
          </label>
          <label className="text-sm font-semibold text-secondary">
            Mastery: {mastery}/5
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
            {pending ? "Saving..." : "Save"}
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
            Cancel
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
        Edit
      </button>
      <CheckInDeleteButton checkInId={checkIn.id} title={`${checkIn.curriculum} · ${checkIn.chapter}`} />
    </div>
  );
}

export function CheckInDeleteButton({
  checkInId,
  title,
}: {
  checkInId: string;
  title: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(`Delete "${title}"?`)) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`/api/student/checkins/${checkInId}`, {
              method: "DELETE",
            });
            router.refresh();
          } catch (submissionError) {
            setMessage(submissionError instanceof Error ? submissionError.message : "Delete failed");
          } finally {
            setPending(false);
          }
        }}
        className="rounded-full border border-error/20 px-3 py-2 text-sm font-semibold text-error disabled:opacity-70"
      >
        {pending ? "Deleting..." : "Delete"}
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
        setMessage("Profile basics and goals updated.");
        router.refresh();
      }}
    >
      <div>
        <p className="text-sm font-semibold text-secondary">Avatar</p>
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
        placeholder="Your full name"
      />
      <input
        value={grade}
        onChange={(event) => setGrade(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Current grade"
      />
      <input
        value={schoolName}
        onChange={(event) => setSchoolName(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Current school"
      />
      <input
        value={countries}
        onChange={(event) => setCountries(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Target countries"
      />
      <input
        value={schools}
        onChange={(event) => setSchools(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Dream schools"
      />
      <input
        value={major}
        onChange={(event) => setMajor(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Intended major"
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          Save Profile
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
        setMessage("Parent profile updated.");
        router.refresh();
      }}
    >
      <div>
        <p className="text-sm font-semibold text-secondary">Avatar</p>
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
        placeholder="Your display name"
      />

      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          Save Profile
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">AI Recommendation</p>
          <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">Practical launch AI</h3>
          <p className="mt-3 text-sm leading-7 text-secondary">
            Generates recommendation summaries, logs the prompt version, and stores traceable artifacts for later bug fixing.
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
          {pending ? "Thinking..." : "Generate"}
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
  const [question, setQuestion] = useState("What should I prioritize this week?");
  const [answer, setAnswer] = useState("");
  const [trace, setTrace] = useState("");

  return (
    <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-terra">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">AI Assistant</p>
      <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">Question-driven support</h3>
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
        Ask AI
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
  const [title, setTitle] = useState("Schedule final essay review");
  const [description, setDescription] = useState("Lock the advisor review slot and collect the latest draft.");
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch("/api/consultant/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            title,
            description,
            dueLabel: "Created by consultant",
            dueDate: new Date().toISOString().slice(0, 10),
            category: "Advisor",
            priority: "High",
            ownerRole: "consultant",
          }),
        });
        setMessage("Task created and audit logged.");
        router.refresh();
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Task title"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          Add Task
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ContentItemComposer() {
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
        setMessage("Manual content item created.");
        router.refresh();
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Title"
      />
      <input
        value={subtitle}
        onChange={(event) => setSubtitle(event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder="Subtitle"
      />
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          Create Content
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function ContentImportPanel() {
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
        setMessage(`Imported ${payload.data?.count ?? 0} items with audit logging.`);
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
        Import Spreadsheet
      </button>
      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
    </form>
  );
}

export function AnalyticsExportButton() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex items-center gap-3">
      <a
        href="/api/analytics/report"
        className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
        onClick={() => setMessage("Downloading cohort analytics report...")}
      >
        Export Report
      </a>
      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
    </div>
  );
}

export function ContentFilterTable({ items }: { items: ContentItem[] }) {
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
        placeholder="Filter content, majors, or schools..."
      />
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-secondary">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Source</th>
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
