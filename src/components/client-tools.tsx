"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useText } from "@/components/locale-provider";
import { AI_DISCLAIMER } from "@/lib/ai/provider";
import { avatarPresets } from "@/lib/avatar-presets";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { shouldUseBrowserSupabaseAuth } from "@/lib/supabase/shared";
import { cn } from "@/lib/utils";
import type { AdvisorNote, ApiResponse, CheckInRecord, ContentItem, Milestone, StudentActivityEntry, StudentApplicationProfile, StudentCompetitionEntry, Task, TimelineLane, UserRole } from "@/lib/types";

type StudentPhaseValue = "Planning" | "Application" | "Submission" | "Decision" | "Visa";

const studentPhaseOptions: { value: StudentPhaseValue; label: string }[] = [
  { value: "Planning", label: "Planning" },
  { value: "Application", label: "Application" },
  { value: "Submission", label: "Submission" },
  { value: "Decision", label: "Decision" },
  { value: "Visa", label: "Visa" },
];

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const rawText = await response.text();
  let payload: ApiResponse<T> | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new Error(`Request failed (${response.status})`);
    }
  }

  if (!payload) {
    throw new Error(`Request failed (${response.status})`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload;
}

export function LoginForm({
  allowedRoles = ["student", "parent", "consultant", "admin"],
  secondaryAction,
}: {
  allowedRoles?: UserRole[];
  secondaryAction?: React.ReactNode;
}) {
  const t = useText();
  const initialRole = allowedRoles[0] ?? "student";
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(initialRole === "admin" ? "admin@terra.edu" : `${initialRole}@terra.edu`);
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
                : role === "consultant"
                  ? "/consultant/students"
                  : "/admin/dashboard"
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
      <div className={`grid gap-3 ${allowedRoles.length === 1 ? "grid-cols-1" : allowedRoles.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
        {allowedRoles.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setRole(item);
              setEmail(item === "admin" ? "admin@terra.edu" : `${item}@terra.edu`);
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
      {secondaryAction ? <div>{secondaryAction}</div> : null}
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
    </form>
  );
}

export function RegistrationForm() {
  const t = useText();
  const router = useRouter();
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");

        try {
          await jsonFetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role,
              name,
              email,
              password,
              grade,
              school,
            }),
          });
          setSuccess(
            role === "student"
              ? t("Registration complete. You can log in now.", "注册成功，现在可以登录了。")
              : t(
                  "Registration complete. Please wait for an administrator to bind this account to a student.",
                  "注册成功，请等待管理员把这个账号绑定到对应学生。"
                )
          );
          startTransition(() => router.push("/login"));
        } catch (submissionError) {
          setError(
            submissionError instanceof Error ? submissionError.message : t("Registration failed", "注册失败")
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["student", "parent", "consultant"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item)}
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
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Full name", "姓名")}
      />

      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Email address", "邮箱地址")}
      />

      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Password (at least 6 characters)", "密码（至少 6 位）")}
      />

      {role === "student" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Current grade", "当前年级")}
          />
          <input
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Current school", "当前学校")}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
      {success ? <p className="text-sm font-semibold text-primary">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold terra-on-primary"
      >
        {pending ? t("Creating account...", "创建中...") : t("Create account", "创建账号")}
      </button>
    </form>
  );
}

export function AdminBindingManager({
  students,
  parents,
  consultants,
  parentLinks,
  consultantLinks,
}: {
  students: { id: string; name: string; grade: string; school: string }[];
  parents: { id: string; name: string; email: string }[];
  consultants: { id: string; name: string; email: string }[];
  parentLinks: { id: string; studentId: string; parentUserId: string }[];
  consultantLinks: { id: string; studentId: string; consultantUserId: string }[];
}) {
  const t = useText();
  const router = useRouter();
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?.id ?? "");
  const [selectedParentStudentId, setSelectedParentStudentId] = useState(students[0]?.id ?? "");
  const [selectedConsultantId, setSelectedConsultantId] = useState(consultants[0]?.id ?? "");
  const [selectedConsultantStudentId, setSelectedConsultantStudentId] = useState(students[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"" | "parent" | "consultant">("");
  const [pendingRemovalId, setPendingRemovalId] = useState("");

  const submitBinding = async (kind: "parent" | "consultant") => {
    setPending(kind);
    setMessage("");
    setError("");

    try {
      await jsonFetch("/api/admin/bindings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          studentId: kind === "parent" ? selectedParentStudentId : selectedConsultantStudentId,
          userId: kind === "parent" ? selectedParentId : selectedConsultantId,
        }),
      });
      setMessage(
        kind === "parent"
          ? t("Parent binding saved.", "家长绑定已保存。")
          : t("Consultant binding saved.", "顾问绑定已保存。")
      );
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("Binding failed.", "绑定失败。"));
    } finally {
      setPending("");
    }
  };

  const removeBinding = async (kind: "parent" | "consultant", linkId: string) => {
    setPendingRemovalId(linkId);
    setMessage("");
    setError("");

    try {
      await jsonFetch("/api/admin/bindings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, linkId }),
      });
      setMessage(
        kind === "parent"
          ? t("Parent binding removed.", "家长绑定已移除。")
          : t("Consultant binding removed.", "顾问绑定已移除。")
      );
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("Unbinding failed.", "解绑失败。"));
    } finally {
      setPendingRemovalId("");
    }
  };

  const resolveStudent = (studentId: string) => students.find((student) => student.id === studentId);
  const resolveParent = (userId: string) => parents.find((user) => user.id === userId);
  const resolveConsultant = (userId: string) => consultants.find((user) => user.id === userId);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Bind parent", "绑定家长")}</p>
          <div className="mt-4 space-y-4">
            <select
              value={selectedParentId}
              onChange={(event) => setSelectedParentId(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            >
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} · {parent.email}
                </option>
              ))}
            </select>
            <select
              value={selectedParentStudentId}
              onChange={(event) => setSelectedParentStudentId(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.grade} · {student.school}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedParentId || !selectedParentStudentId || pending !== ""}
              onClick={() => void submitBinding("parent")}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold terra-on-primary sm:w-auto"
            >
              {pending === "parent" ? t("Saving...", "保存中...") : t("Bind parent to student", "把家长绑定到学生")}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Bind consultant", "绑定顾问")}</p>
          <div className="mt-4 space-y-4">
            <select
              value={selectedConsultantId}
              onChange={(event) => setSelectedConsultantId(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            >
              {consultants.map((consultant) => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name} · {consultant.email}
                </option>
              ))}
            </select>
            <select
              value={selectedConsultantStudentId}
              onChange={(event) => setSelectedConsultantStudentId(event.target.value)}
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.grade} · {student.school}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedConsultantId || !selectedConsultantStudentId || pending !== ""}
              onClick={() => void submitBinding("consultant")}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold terra-on-primary sm:w-auto"
            >
              {pending === "consultant" ? t("Saving...", "保存中...") : t("Bind consultant to student", "把顾问绑定到学生")}
            </button>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Current parent bindings", "当前家长绑定")}</p>
          <div className="mt-4 space-y-3">
            {parentLinks.length > 0 ? (
              parentLinks.map((link) => {
                const student = resolveStudent(link.studentId);
                const parent = resolveParent(link.parentUserId);
                return (
                  <div key={link.id} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-foreground">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{parent?.name ?? link.parentUserId} → {student?.name ?? link.studentId}</span>
                      <button
                        type="button"
                        disabled={pendingRemovalId === link.id}
                        onClick={() => void removeBinding("parent", link.id)}
                        className="rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-bold text-primary disabled:opacity-60"
                      >
                        {pendingRemovalId === link.id ? t("Removing...", "移除中...") : t("Remove", "移除绑定")}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
                {t("No parent bindings yet.", "还没有家长绑定。")}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Current consultant bindings", "当前顾问绑定")}</p>
          <div className="mt-4 space-y-3">
            {consultantLinks.length > 0 ? (
              consultantLinks.map((link) => {
                const student = resolveStudent(link.studentId);
                const consultant = resolveConsultant(link.consultantUserId);
                return (
                  <div key={link.id} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-foreground">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{consultant?.name ?? link.consultantUserId} → {student?.name ?? link.studentId}</span>
                      <button
                        type="button"
                        disabled={pendingRemovalId === link.id}
                        onClick={() => void removeBinding("consultant", link.id)}
                        className="rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-bold text-primary disabled:opacity-60"
                      >
                        {pendingRemovalId === link.id ? t("Removing...", "移除中...") : t("Remove", "移除绑定")}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
                {t("No consultant bindings yet.", "还没有顾问绑定。")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminMemberManager({
  members,
}: {
  members: {
    id: string;
    name: string;
    email: string;
    role: Exclude<UserRole, "admin">;
    linkedStudents: string[];
  }[];
}) {
  const t = useText();
  const router = useRouter();
  const [confirmingUserId, setConfirmingUserId] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="rounded-3xl bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-foreground">{member.name}</p>
              <p className="mt-1 text-sm text-secondary">
                {member.email} · {translateRole(member.role, t)}
              </p>
              <p className="mt-2 text-xs text-outline">
                {member.linkedStudents.length > 0
                  ? t(
                      `Linked students: ${member.linkedStudents.join(", ")}`,
                      `已绑定学生：${member.linkedStudents.join("、")}`
                    )
                  : t("No linked students yet", "还没有绑定学生")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`/api/admin/members/${member.id}/export`}
                className="w-full rounded-full border border-outline-variant px-4 py-2 text-center text-sm font-bold text-primary sm:w-auto"
              >
                {t("Export member data", "导出成员数据")}
              </a>
              <button
                type="button"
                onClick={() => {
                  setConfirmingUserId((current) => (current === member.id ? "" : member.id));
                  setConfirmationText("");
                  setError("");
                  setMessage("");
                }}
                className="w-full rounded-full bg-error px-4 py-2 text-sm font-bold text-white sm:w-auto"
              >
                {t("Delete member", "删除成员")}
              </button>
            </div>
          </div>

          {confirmingUserId === member.id ? (
            <div className="mt-4 rounded-2xl bg-error/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                {t("Second confirmation required", "需要二次确认")}
              </p>
              <p className="mt-2 text-sm leading-7 text-secondary">
                {t(
                  `Type ${member.email} to confirm deleting this account and all related records.`,
                  `请输入 ${member.email} 以确认删除这个账号及其关联记录。`
                )}
              </p>
              <input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3"
                placeholder={member.email}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={pendingDeleteUserId === member.id}
                  onClick={async () => {
                    setPendingDeleteUserId(member.id);
                    setError("");
                    setMessage("");
                    try {
                      await jsonFetch(`/api/admin/members/${member.id}`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ confirmation: confirmationText }),
                      });
                      setMessage(t("Member deleted.", "成员已删除。"));
                      setConfirmingUserId("");
                      setConfirmationText("");
                      router.refresh();
                    } catch (submissionError) {
                      setError(
                        submissionError instanceof Error
                          ? submissionError.message
                          : t("Deletion failed.", "删除失败。")
                      );
                    } finally {
                      setPendingDeleteUserId("");
                    }
                  }}
                  className="w-full rounded-full bg-error px-4 py-2 text-sm font-bold text-white sm:w-auto"
                >
                  {pendingDeleteUserId === member.id ? t("Deleting...", "删除中...") : t("Confirm delete", "确认删除")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingUserId("");
                    setConfirmationText("");
                  }}
                  className="w-full rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary sm:w-auto"
                >
                  {t("Cancel", "取消")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ))}

      {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
    </div>
  );
}

export function AdminStudentImportManager() {
  const t = useText();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{
    studentName?: string;
    createdUser?: boolean;
    createdStudent?: boolean;
    tasksImported?: number;
    milestonesImported?: number;
    notesImported?: number;
    parentBindings?: number;
    consultantBindings?: number;
    warnings?: string[];
  } | null>(null);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {t("Workbook import", "工作簿导入")}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          {t("Import one student's full record", "一次导入一个学生的完整资料")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-secondary">
          {t(
            "Use the template workbook, fill each sheet outside the platform, then upload it here. The importer updates the student profile, application profile, competitions, activities, tasks, milestones, notes, and optional bindings.",
            "使用模板工作簿，在系统外填好各个 sheet 后上传到这里。导入会更新学生基础资料、申请档案、竞赛、活动、任务、截止日期、顾问备注，以及可选的绑定关系。"
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/admin/student-import/template"
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary"
          >
            {t("Download template", "下载模板")}
          </a>
          <a
            href="/api/admin/student-import/guide"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-primary"
          >
            {t("Open filling guide", "打开填写说明")}
          </a>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            t("Required sheet names: student_account, application_profile, competitions, activities, tasks, milestones, notes, bindings.", "固定 sheet 名称：student_account、application_profile、competitions、activities、tasks、milestones、notes、bindings。"),
            t("The importer is merge-first. Student profile and application profile are updated; tasks, milestones, notes, and bindings are added or matched without hard deleting existing data.", "导入默认偏向合并。学生资料和申请档案会更新；任务、截止日期、备注、绑定会按匹配规则补充，不会先把旧数据整批删除。"),
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm leading-7 text-secondary">
              {item}
            </div>
          ))}
        </div>
      </div>

      <form
        className="rounded-3xl bg-white p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!file) {
            setError(t("Please choose an .xlsx workbook first.", "请先选择一个 .xlsx 工作簿。"));
            setMessage("");
            return;
          }

          setPending(true);
          setError("");
          setMessage("");
          setDetails(null);

          try {
            const formData = new FormData();
            formData.append("file", file);
            const payload = await jsonFetch<{
              studentName: string;
              createdUser: boolean;
              createdStudent: boolean;
              tasksImported: number;
              milestonesImported: number;
              notesImported: number;
              parentBindings: number;
              consultantBindings: number;
              warnings: string[];
            }>("/api/admin/student-import", {
              method: "POST",
              body: formData,
            });
            setMessage(payload.message);
            setDetails(payload.data ?? null);
            setFile(null);
            router.refresh();
          } catch (submissionError) {
            setError(
              submissionError instanceof Error
                ? submissionError.message
                : t("Import failed.", "导入失败。")
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-secondary">
              {t("Student workbook (.xlsx)", "学生资料工作簿（.xlsx）")}
            </p>
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
            />
            <p className="mt-2 text-xs text-outline">
              {file
                ? t(`Selected: ${file.name}`, `已选择：${file.name}`)
                : t("Use the provided template workbook to reduce import errors.", "建议使用系统提供的模板工作簿，能明显减少导入错误。")}
            </p>
          </div>

          <button
            disabled={pending}
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? t("Importing...", "导入中...") : t("Import student workbook", "导入学生工作簿")}
          </button>
        </div>

        {message ? <p className="mt-4 text-sm font-semibold text-primary">{message}</p> : null}
        {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

        {details ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">
              <p className="font-semibold text-foreground">
                {t("Imported student", "已导入学生")} · {details.studentName ?? "-"}
              </p>
              <p className="mt-2">{t(`New account created: ${details.createdUser ? "Yes" : "No"}`, `新建账号：${details.createdUser ? "是" : "否"}`)}</p>
              <p>{t(`New student record created: ${details.createdStudent ? "Yes" : "No"}`, `新建学生记录：${details.createdStudent ? "是" : "否"}`)}</p>
              <p>{t(`Tasks imported: ${details.tasksImported ?? 0}`, `导入任务：${details.tasksImported ?? 0}`)}</p>
              <p>{t(`Milestones imported: ${details.milestonesImported ?? 0}`, `导入截止日期：${details.milestonesImported ?? 0}`)}</p>
              <p>{t(`Notes imported: ${details.notesImported ?? 0}`, `导入备注：${details.notesImported ?? 0}`)}</p>
              <p>{t(`Parent bindings added: ${details.parentBindings ?? 0}`, `新增家长绑定：${details.parentBindings ?? 0}`)}</p>
              <p>{t(`Consultant bindings added: ${details.consultantBindings ?? 0}`, `新增顾问绑定：${details.consultantBindings ?? 0}`)}</p>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">
              <p className="font-semibold text-foreground">{t("Warnings", "提示与警告")}</p>
              {details.warnings?.length ? (
                <ul className="mt-2 space-y-2">
                  {details.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{t("No warnings. The workbook matched cleanly.", "没有警告，这次导入匹配很顺利。")}</p>
              )}
            </div>
          </div>
        ) : null}
      </form>
    </div>
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
  if (role === "admin") return t("admin", "管理员");
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
      <div className="rounded-[1.4rem] border border-black/5 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
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
      className="rounded-[1.4rem] border border-black/5 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
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
          className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          placeholder={t("Timeline task title", "时间线任务标题")}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          placeholder={t("Describe the outcome for this task", "描述这个任务的目标与结果")}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Timeline lane", "时间线分类")}
          <select
            value={timelineLane}
            onChange={(event) => setTimelineLane(event.target.value as TimelineLane)}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("End date", "结束日期")}
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-secondary">
        {(() => {
          const matchedLane = timelineLaneOptions.find((item) => item.value === timelineLane);
          return matchedLane ? t(matchedLane.helper.en, matchedLane.helper.zh) : null;
        })()}
      </p>

      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm"
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
      className="rounded-[1.4rem] border border-black/5 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
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
          className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Status", "状态")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm"
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
        className="mt-4 rounded-2xl bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4"
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
            className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
            placeholder={t("Deadline title", "截止日期标题")}
          />
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <option value="upcoming">{t("upcoming", "待开始")}</option>
            <option value="done">{t("done", "已完成")}</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-70 sm:px-4 sm:text-sm"
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
            className="rounded-full border border-outline-variant px-3 py-2 text-xs font-bold text-primary sm:px-4 sm:text-sm"
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
        className="rounded-full border border-error/20 px-3 py-2 text-xs font-semibold text-error disabled:opacity-70 sm:text-sm"
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
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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

export function AdvisorNoteEditorControls({
  note,
  endpointBase = "/api/consultant/notes",
}: {
  note: Pick<AdvisorNote, "id" | "title" | "summary">;
  endpointBase?: string;
}) {
  const t = useText();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [summary, setSummary] = useState(note.summary);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (isEditing) {
    return (
      <form
        className="mt-4 space-y-3 rounded-2xl border border-black/5 bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${note.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, summary }),
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
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm"
          placeholder={t("Note title", "备注标题")}
        />
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="min-h-28 w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm"
          placeholder={t("Advisor note", "顾问备注")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold terra-on-primary disabled:opacity-70"
          >
            {pending ? t("Saving...", "保存中...") : t("Save changes", "保存修改")}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setTitle(note.title);
              setSummary(note.summary);
              setMessage("");
            }}
            className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-primary"
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
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(t(`Delete "${note.title}"?`, `确定删除“${note.title}”吗？`))) {
            return;
          }

          setPending(true);
          setMessage("");

          try {
            await jsonFetch(`${endpointBase}/${note.id}`, {
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
  defaultPhase,
  defaultCountries,
  defaultDreamSchools,
  defaultMajor,
  defaultAvatar,
}: {
  studentId: string;
  defaultName: string;
  defaultGrade: string;
  defaultSchool: string;
  defaultPhase: string;
  defaultCountries: string[];
  defaultDreamSchools: string[];
  defaultMajor: string;
  defaultAvatar: string;
}) {
  const t = useText();
  const [name, setName] = useState(defaultName);
  const [grade, setGrade] = useState(defaultGrade);
  const [schoolName, setSchoolName] = useState(defaultSchool);
  const [phase, setPhase] = useState<StudentPhaseValue>(normalizeStudentPhase(defaultPhase));
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
            phase,
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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
        className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
      <select
        aria-label="Current phase"
        value={phase}
        onChange={(event) => setPhase(event.target.value as StudentPhaseValue)}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-base font-medium text-foreground"
      >
        {studentPhaseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t("Save Profile", "保存资料")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

function ApplicationProfileEditorForm({
  profile,
  savePath,
  successMessage,
  buttonLabel,
}: {
  profile: StudentApplicationProfile;
  savePath: string;
  successMessage: { en: string; zh: string };
  buttonLabel: { en: string; zh: string };
}) {
  const t = useText();
  const router = useRouter();
  const [legalFirstName, setLegalFirstName] = useState(profile.legalFirstName);
  const [legalLastName, setLegalLastName] = useState(profile.legalLastName);
  const [preferredName, setPreferredName] = useState(profile.preferredName);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [citizenship, setCitizenship] = useState(profile.citizenship);
  const [birthCountry, setBirthCountry] = useState(profile.birthCountry);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1);
  const [city, setCity] = useState(profile.city);
  const [stateProvince, setStateProvince] = useState(profile.stateProvince);
  const [postalCode, setPostalCode] = useState(profile.postalCode);
  const [countryOfResidence, setCountryOfResidence] = useState(profile.countryOfResidence);
  const [highSchoolName, setHighSchoolName] = useState(profile.highSchoolName);
  const [curriculumSystem, setCurriculumSystem] = useState(profile.curriculumSystem);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [gpa, setGpa] = useState(profile.gpa);
  const [classRank, setClassRank] = useState(profile.classRank);
  const englishProficiencyStatus = profile.englishProficiencyStatus;
  const intendedStartTerm = profile.intendedStartTerm;
  const [passportCountry, setPassportCountry] = useState(profile.passportCountry);
  const additionalContext = profile.additionalContext;
  const [competitions, setCompetitions] = useState<StudentCompetitionEntry[]>(profile.competitions);
  const [activities, setActivities] = useState<StudentActivityEntry[]>(profile.activities);
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        await jsonFetch(savePath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            legalFirstName,
            legalLastName,
            preferredName,
            dateOfBirth,
            citizenship,
            birthCountry,
            phoneNumber,
            addressLine1,
            city,
            stateProvince,
            postalCode,
            countryOfResidence,
            highSchoolName,
            curriculumSystem,
            graduationYear,
            gpa,
            classRank,
            englishProficiencyStatus,
            intendedStartTerm,
            passportCountry,
            additionalContext,
            competitions,
            activities,
            ...(savePath.includes("/api/student/")
              ? { studentId: profile.studentId }
              : {}),
          }),
        });
        setMessage(t(successMessage.en, successMessage.zh));
        router.refresh();
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
              {t("Personal", "个人信息")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {t("Identity basics", "身份基础信息")}
            </h3>
          </div>
          <input value={legalFirstName} onChange={(event) => setLegalFirstName(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Legal first name", "法定名字")} />
          <input value={legalLastName} onChange={(event) => setLegalLastName(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Legal last name", "法定姓氏")} />
          <input value={preferredName} onChange={(event) => setPreferredName(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Preferred name", "常用名")} />
          <input value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Date of birth (YYYY-MM-DD)", "出生日期（YYYY-MM-DD）")} />
          <input value={citizenship} onChange={(event) => setCitizenship(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Citizenship", "国籍")} />
          <input value={birthCountry} onChange={(event) => setBirthCountry(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Birth country", "出生国家")} />
          <input value={passportCountry} onChange={(event) => setPassportCountry(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Passport country", "护照签发国家")} />
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
              {t("Contact", "联系信息")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {t("Reachable details", "联系与居住信息")}
            </h3>
          </div>
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Phone number", "手机号")} />
          <input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Address line", "地址")} />
          <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("City", "城市")} />
          <input value={stateProvince} onChange={(event) => setStateProvince(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("State / Province", "州 / 省")} />
          <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Postal code", "邮编")} />
          <input value={countryOfResidence} onChange={(event) => setCountryOfResidence(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Country of residence", "当前居住国家")} />
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
              {t("Education", "教育背景")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {t("High school snapshot", "高中信息概览")}
            </h3>
          </div>
          <input value={highSchoolName} onChange={(event) => setHighSchoolName(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Current high school", "当前高中")} />
          <select value={curriculumSystem} onChange={(event) => setCurriculumSystem(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3">
            {["AP", "A-Level", "IBDP", "US High School", "Canadian High School", "Other"].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Graduation year", "毕业年份")} />
          <input value={gpa} onChange={(event) => setGpa(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("GPA", "GPA")} />
          <input value={classRank} onChange={(event) => setClassRank(event.target.value)} className="w-full rounded-2xl bg-surface-container-low px-4 py-3" placeholder={t("Class rank / percentile", "班级排名 / 百分位")} />
        </div>

      </div>

      <div className="space-y-6 rounded-3xl bg-white p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
            {t("Competitions", "竞赛")}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            {t("Top 10 competition entries", "10 个竞赛格子")}
          </h3>
          <p className="mt-2 text-sm text-secondary">
            {t(
              "Fill in the strongest competitions only. Use one row per competition and keep the result concise.",
              "这里只填最重要的竞赛经历。一行一条，结果尽量写清楚但不要过长。"
            )}
          </p>
        </div>
        <div className="space-y-3 md:hidden">
          {competitions.map((entry, index) => (
            <CompetitionEntryCard
              key={`competition-mobile-${index}`}
              index={index}
              entry={entry}
              onChange={(nextEntry) =>
                setCompetitions((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? nextEntry : item))
                )
              }
            />
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-3xl border border-black/5 md:block">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-surface-container-low text-secondary">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">{t("Competition name", "竞赛名称")}</th>
                <th className="px-3 py-3">{t("Field", "学科 / 方向")}</th>
                <th className="px-3 py-3">{t("Year", "年份")}</th>
                <th className="px-3 py-3">{t("Level", "级别")}</th>
                <th className="px-3 py-3">{t("Result / honor", "结果 / 奖项")}</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((entry, index) => (
                <CompetitionEntryRow
                  key={`competition-${index}`}
                  index={index}
                  entry={entry}
                  onChange={(nextEntry) =>
                    setCompetitions((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? nextEntry : item))
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            t("Competition name: official or commonly used name.", "竞赛名称：填正式名称或大家常用名称。"),
            t("Level: school, regional, national, or international.", "级别：比如校级、地区级、国家级、国际级。"),
            t("Result: award, finalist, qualification, or ranking.", "结果：写获奖、入围、晋级、排名等。"),
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 rounded-3xl bg-white p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
            {t("Activities", "活动")}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            {t("Top 20 activity entries", "20 个活动格子")}
          </h3>
          <p className="mt-2 text-sm text-secondary">
            {t(
              "This follows the Common App style more closely. Focus on role, grade span, weekly time, and real impact.",
              "这里更接近 Common App 的活动填写逻辑。重点写角色、年级跨度、时间投入和真实影响。"
            )}
          </p>
        </div>
        <div className="space-y-3 md:hidden">
          {activities.map((entry, index) => (
            <ActivityEntryCard
              key={`activity-mobile-${index}`}
              index={index}
              entry={entry}
              onChange={(nextEntry) =>
                setActivities((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? nextEntry : item))
                )
              }
            />
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-3xl border border-black/5 md:block">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="bg-surface-container-low text-secondary">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">{t("Activity name", "活动名称")}</th>
                <th className="px-3 py-3">{t("Role / title", "角色 / 职务")}</th>
                <th className="px-3 py-3">{t("Grades", "参与年级")}</th>
                <th className="px-3 py-3">{t("Time commitment", "时间投入")}</th>
                <th className="px-3 py-3">{t("Impact / description", "影响 / 简述")}</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((entry, index) => (
                <ActivityEntryRow
                  key={`activity-${index}`}
                  index={index}
                  entry={entry}
                  onChange={(nextEntry) =>
                    setActivities((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? nextEntry : item))
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            t("Role / title: founder, captain, member, researcher, volunteer.", "角色 / 职务：比如创始人、队长、成员、研究助理、志愿者。"),
            t("Grades: list when you participated, such as 9-11.", "参与年级：写你参加的年级，比如 9-11。"),
            t("Impact: write what changed, led, built, or achieved.", "影响 / 简述：写你做成了什么、带来了什么变化。"),
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-secondary">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
          {t(buttonLabel.en, buttonLabel.zh)}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

function CompetitionEntryRow({
  index,
  entry,
  onChange,
}: {
  index: number;
  entry: StudentCompetitionEntry;
  onChange: (entry: StudentCompetitionEntry) => void;
}) {
  return (
    <tr className="border-t border-black/5">
      <td className="px-3 py-3 text-xs font-bold text-secondary">{index + 1}</td>
      <td className="px-3 py-3">
        <input value={entry.name} onChange={(event) => onChange({ ...entry, name: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.field} onChange={(event) => onChange({ ...entry, field: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.year} onChange={(event) => onChange({ ...entry, year: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.level} onChange={(event) => onChange({ ...entry, level: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.result} onChange={(event) => onChange({ ...entry, result: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
    </tr>
  );
}

function CompetitionEntryCard({
  index,
  entry,
  onChange,
}: {
  index: number;
  entry: StudentCompetitionEntry;
  onChange: (entry: StudentCompetitionEntry) => void;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">#{index + 1}</p>
      <div className="mt-3 space-y-3">
        <input value={entry.name} onChange={(event) => onChange({ ...entry, name: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Competition name / 竞赛名称" />
        <input value={entry.field} onChange={(event) => onChange({ ...entry, field: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Field / 学科方向" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={entry.year} onChange={(event) => onChange({ ...entry, year: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Year / 年份" />
          <input value={entry.level} onChange={(event) => onChange({ ...entry, level: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Level / 级别" />
        </div>
        <input value={entry.result} onChange={(event) => onChange({ ...entry, result: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Result / 结果奖项" />
      </div>
    </div>
  );
}

function ActivityEntryRow({
  index,
  entry,
  onChange,
}: {
  index: number;
  entry: StudentActivityEntry;
  onChange: (entry: StudentActivityEntry) => void;
}) {
  return (
    <tr className="border-t border-black/5">
      <td className="px-3 py-3 text-xs font-bold text-secondary">{index + 1}</td>
      <td className="px-3 py-3">
        <input value={entry.name} onChange={(event) => onChange({ ...entry, name: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.role} onChange={(event) => onChange({ ...entry, role: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.grades} onChange={(event) => onChange({ ...entry, grades: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <input value={entry.timeCommitment} onChange={(event) => onChange({ ...entry, timeCommitment: event.target.value })} className="w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
      <td className="px-3 py-3">
        <textarea value={entry.impact} onChange={(event) => onChange({ ...entry, impact: event.target.value })} className="min-h-20 w-full rounded-2xl bg-surface-container-low px-3 py-2" />
      </td>
    </tr>
  );
}

function ActivityEntryCard({
  index,
  entry,
  onChange,
}: {
  index: number;
  entry: StudentActivityEntry;
  onChange: (entry: StudentActivityEntry) => void;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">#{index + 1}</p>
      <div className="mt-3 space-y-3">
        <input value={entry.name} onChange={(event) => onChange({ ...entry, name: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Activity name / 活动名称" />
        <input value={entry.role} onChange={(event) => onChange({ ...entry, role: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Role / 角色职务" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={entry.grades} onChange={(event) => onChange({ ...entry, grades: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Grades / 年级" />
          <input value={entry.timeCommitment} onChange={(event) => onChange({ ...entry, timeCommitment: event.target.value })} className="w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Time / 时间投入" />
        </div>
        <textarea value={entry.impact} onChange={(event) => onChange({ ...entry, impact: event.target.value })} className="min-h-24 w-full rounded-2xl bg-white px-3 py-2.5" placeholder="Impact / 影响简述" />
      </div>
    </div>
  );
}

export function StudentApplicationProfileEditor({
  profile,
}: {
  profile: StudentApplicationProfile;
}) {
  return (
    <ApplicationProfileEditorForm
      profile={profile}
      savePath="/api/student/application-profile"
      successMessage={{ en: "Application information updated.", zh: "申请信息已更新。" }}
      buttonLabel={{ en: "Save Application Profile", zh: "保存申请信息" }}
    />
  );
}

export function ConsultantStudentApplicationProfileEditor({
  studentId,
  profile,
}: {
  studentId: string;
  profile: StudentApplicationProfile;
}) {
  return (
    <ApplicationProfileEditorForm
      profile={profile}
      savePath={`/api/consultant/students/${studentId}/application-profile`}
      successMessage={{ en: "Student application information updated.", zh: "学生申请信息已更新。" }}
      buttonLabel={{ en: "Save Application Intake", zh: "保存申请档案" }}
    />
  );
}

export function StudentDocumentHubEditor({
  studentId,
  transcriptSourceMarkdown,
  transcriptStructuredMarkdown,
}: {
  studentId: string;
  transcriptSourceMarkdown: string;
  transcriptStructuredMarkdown: string;
}) {
  const t = useText();
  const router = useRouter();
  const [sourceMarkdown, setSourceMarkdown] = useState(transcriptSourceMarkdown);
  const [structuredMarkdown, setStructuredMarkdown] = useState(transcriptStructuredMarkdown);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [aiPending, setAiPending] = useState(false);

  async function persist(nextSource: string, nextStructured: string, successText: string) {
    await jsonFetch("/api/student/document-hub", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        transcriptSourceMarkdown: nextSource,
        transcriptStructuredMarkdown: nextStructured,
      }),
    });
    setMessage(successText);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
          {t("Transcript source", "成绩单原文")}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          {t("Paste your markdown transcript here", "把你的 Markdown 成绩单贴在这里")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-secondary">
          {t(
            "You do not need real file upload yet. Paste the transcript or score report markdown here first, then ask AI to structure it.",
            "现在还不用真的上传文件。先把成绩单或分数报告的 Markdown 原文贴在这里，再让 AI 帮你整理成更清晰的版本。"
          )}
        </p>
        <textarea
          value={sourceMarkdown}
          onChange={(event) => setSourceMarkdown(event.target.value)}
          className="mt-4 min-h-64 w-full rounded-3xl bg-surface-container-low px-4 py-4 font-mono text-sm"
          placeholder={t("## Semester 1\n- AP Calculus AB: A\n- AP Physics 1: A-\n", "## 高一上\n- AP Calculus AB: A\n- AP Physics 1: A-\n")}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setMessage("");
              try {
                await persist(
                  sourceMarkdown,
                  structuredMarkdown,
                  t("Transcript source saved.", "成绩单原文已保存。")
                );
              } catch (submissionError) {
                setMessage(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t("Save failed.", "保存失败。")
                );
              } finally {
                setPending(false);
              }
            }}
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? t("Saving...", "保存中...") : t("Save transcript source", "保存成绩单原文")}
          </button>
          <button
            type="button"
            disabled={aiPending || !sourceMarkdown.trim()}
            onClick={async () => {
              setAiPending(true);
              setMessage("");
              try {
                const payload = await jsonFetch<{
                  summary: string;
                  parsedMarkdown: string;
                }>("/api/ai/workflows", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    kind: "student_transcript_parse",
                    studentId,
                    page: "/student/documents",
                    text: sourceMarkdown,
                  }),
                });

                const nextStructured = payload.data?.parsedMarkdown ?? "";
                setStructuredMarkdown(nextStructured);
                await persist(
                  sourceMarkdown,
                  nextStructured,
                  t("AI transcript summary generated and saved.", "AI 整理后的成绩单已生成并保存。")
                );
              } catch (submissionError) {
                setMessage(
                  submissionError instanceof Error
                    ? submissionError.message
                    : t("AI parsing failed.", "AI 识别失败。")
                );
              } finally {
                setAiPending(false);
              }
            }}
            className="rounded-full border border-outline-variant px-5 py-3 text-sm font-bold text-primary disabled:opacity-70"
          >
            {aiPending ? t("AI is parsing...", "AI 识别中...") : t("Let AI structure the transcript", "让 AI 整理成绩单")}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm font-semibold text-primary">{message}</p> : null}
      </div>

      <MarkdownDocumentPanel
        eyebrow={t("Structured transcript", "整理后的成绩单")}
        title={t("AI-readable transcript view", "AI 可读的成绩单视图")}
        markdown={structuredMarkdown}
        emptyText={t("Once AI finishes, the structured transcript will appear here.", "AI 整理完成后，这里会显示更清晰的成绩单版本。")}
      />
    </div>
  );
}

export function ConsultantPlanningBookEditor({
  studentId,
  planningBookMarkdown,
}: {
  studentId: string;
  planningBookMarkdown: string;
}) {
  const t = useText();
  const router = useRouter();
  const [markdown, setMarkdown] = useState(planningBookMarkdown);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        try {
          await jsonFetch(`/api/consultant/students/${studentId}/document-hub`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planningBookMarkdown: markdown,
            }),
          });
          setMessage(t("Planning book updated.", "规划书已更新。"));
          router.refresh();
        } catch (submissionError) {
          setMessage(
            submissionError instanceof Error
              ? submissionError.message
              : t("Save failed.", "保存失败。")
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {t(
          "Use markdown. Long planning books are fine here, and they will be shown to the student as read-only content.",
          "这里支持 Markdown。四五千字的长规划书也可以直接放，学生端会同步成只读内容。"
        )}
      </p>
      <textarea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        className="min-h-[360px] w-full rounded-[1.4rem] bg-surface-container-low px-3 py-3 font-mono text-xs sm:min-h-[420px] sm:rounded-3xl sm:px-4 sm:py-4 sm:text-sm"
        placeholder={t("## Student Planning Book\n\n### Positioning\n...\n", "## 学生规划书\n\n### 定位\n...\n")}
      />
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm"
        >
          {pending ? t("Saving...", "保存中...") : t("Save planning book", "保存规划书")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

export function MarkdownDocumentPanel({
  eyebrow,
  title,
  markdown,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  markdown: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/5 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">{eyebrow}</p>
      <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      <div className="mt-4 rounded-[24px] border border-black/5 bg-[#f8f4ee] px-4 py-4 sm:rounded-[28px] sm:px-6 sm:py-6">
        {markdown.trim() ? (
          <div className="space-y-4 text-sm leading-7 text-[#3f3a34] sm:text-[15px] sm:leading-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{children}</h1>,
                h2: ({ children }) => <h2 className="pt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">{children}</h2>,
                h3: ({ children }) => <h3 className="pt-1 text-base font-semibold text-foreground sm:text-lg">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-7 text-[#3f3a34] sm:text-[15px] sm:leading-8">{children}</p>,
                ul: ({ children }) => <ul className="space-y-3 pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="space-y-3 pl-5">{children}</ol>,
                li: ({ children }) => <li className="marker:text-primary">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic text-[#5a534d]">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="rounded-2xl border-l-4 border-primary/35 bg-white/70 px-4 py-3 text-[#5a534d]">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="rounded-lg bg-white px-2 py-1 font-mono text-[0.92em] text-foreground">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-2xl bg-[#efe8de] p-4 text-sm text-foreground">{children}</pre>
                ),
                hr: () => <hr className="border-black/8" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
                    <table className="min-w-full text-left text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="bg-[#f3ede5] px-4 py-3 font-semibold text-foreground">{children}</th>,
                td: ({ children }) => <td className="border-t border-black/5 px-4 py-3 text-[#4d4740]">{children}</td>,
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-secondary">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export function StudentDocumentsWorkspace({
  studentId,
  profile,
}: {
  studentId: string;
  profile: StudentApplicationProfile;
}) {
  const t = useText();
  const [expandedSection, setExpandedSection] = useState<"profile" | "transcript" | "planning" | null>(null);

  const sections = [
    {
      key: "profile" as const,
      eyebrow: t("Structured profile", "结构化档案"),
      title: t("Application profile", "申请档案"),
      description: t(
        "Identity, school, curriculum, GPA, competitions, and activities.",
        "身份、学校、课程体系、GPA、竞赛和活动。"
      ),
      status: `${profile.competitions.filter((item) => item.name.trim()).length}/10 · ${profile.activities.filter((item) => item.name.trim()).length}/20`,
      content: <StudentApplicationProfileEditor profile={profile} />,
    },
    {
      key: "transcript" as const,
      eyebrow: t("Markdown + AI", "Markdown 录入 + AI 整理"),
      title: t("Transcript intake", "成绩单整理"),
      description: t(
        "Paste transcript markdown, save it, and let AI turn it into a clearer transcript view.",
        "贴成绩单 Markdown 原文，保存后让 AI 整理成更清晰的成绩单视图。"
      ),
      status: profile.transcriptSourceMarkdown.trim() ? t("Added", "已录入") : t("Empty", "未录入"),
      content: (
        <StudentDocumentHubEditor
          studentId={studentId}
          transcriptSourceMarkdown={profile.transcriptSourceMarkdown}
          transcriptStructuredMarkdown={profile.transcriptStructuredMarkdown}
        />
      ),
    },
    {
      key: "planning" as const,
      eyebrow: t("Consultant synced", "顾问同步内容"),
      title: t("Planning book", "规划书"),
      description: t(
        "A long-form planning memo from the consultant, shown to the student in read-only form.",
        "顾问写入的长规划书，学生端只读查看。"
      ),
      status: profile.planningBookMarkdown.trim() ? t("Synced", "已同步") : t("Empty", "未同步"),
      content: (
        <MarkdownDocumentPanel
          eyebrow={t("Read-only", "只读查看")}
          title={t("Your consultant planning book", "你的顾问规划书")}
          markdown={profile.planningBookMarkdown}
          emptyText={t("Your consultant has not synced a planning book yet.", "顾问还没有同步规划书。")}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {sections.map((section) => {
        const expanded = expandedSection === section.key;

        return (
          <div
            key={section.key}
            className={cn(
              "overflow-hidden rounded-[22px] border border-black/5 bg-white transition-all duration-200 sm:rounded-[28px]",
              expanded ? "shadow-terra" : "shadow-sm"
            )}
          >
            <button
              type="button"
              onClick={() => setExpandedSection(expanded ? null : section.key)}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">{section.eyebrow}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-foreground sm:text-lg">{section.title}</h3>
                  <span className="inline-flex rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-bold text-primary sm:px-3 sm:py-1.5 sm:text-xs">
                    {section.status}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{section.description}</p>
              </div>
              <span
                className={cn(
                  "mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant text-base font-bold text-primary transition-transform sm:h-9 sm:w-9 sm:text-lg",
                  expanded ? "rotate-180" : ""
                )}
                aria-hidden="true"
              >
                ˅
              </span>
            </button>

            {expanded ? <div className="border-t border-black/5 bg-[#fcfaf6] px-4 py-4 sm:px-5 sm:py-5">{section.content}</div> : null}
          </div>
        );
      })}
    </div>
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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
  title,
  description,
  buttonLabel,
}: {
  studentId: string;
  page: string;
  feature: string;
  prompt: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
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
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const router = useRouter();

  const runGeneration = async () => {
    setPending(true);
    setError("");
    setCopied("");
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
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-primary/5 p-4 sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("AI Recommendation", "AI 推荐")}</p>
          <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">
            {title ?? t("Practical launch AI", "可落地的 AI 助手")}
          </h3>
          <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
            {description ??
              t(
                "Generates recommendation summaries, logs the prompt version, and stores traceable artifacts for later bug fixing.",
                "会生成建议摘要、记录提示词版本，并保存可追踪结果，方便后续排查和修复。"
              )}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={runGeneration}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
        >
          {pending ? t("Thinking...", "生成中...") : buttonLabel ?? t("Generate", "生成")}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}

      {result ? (
        <div className="mt-5 rounded-[1.3rem] bg-white p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-5">
          <AiDisclaimerBanner />
          <MarkdownText className="text-sm text-secondary">{result.summary}</MarkdownText>
          <ul className="mt-4 space-y-2">
            {result.recommendations.map((item) => (
              <li key={item} className="rounded-2xl bg-surface-container-low px-4 py-3">
                <MarkdownText className="text-sm text-secondary">{item}</MarkdownText>
              </li>
            ))}
          </ul>
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(
                [
                  result.summary,
                  "",
                  ...result.recommendations.map((item, index) => `${index + 1}. ${item}`),
                ].join("\n")
              );
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runGeneration}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
          />
          <AiStudentFeedback />
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">
            trace_id: {result.trace_id} · decision_id: {result.decision_id}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AiChatWidget({
  studentId,
  page = "/student/dashboard",
  title,
  description,
  defaultQuestion,
  buttonLabel,
  audience = "student",
  studentOptions,
}: {
  studentId: string;
  page?: string;
  title?: string;
  description?: string;
  defaultQuestion?: string;
  buttonLabel?: string;
  audience?: UserRole;
  studentOptions?: { id: string; label: string; sublabel?: string }[];
}) {
  const t = useText();
  const [activeStudentId, setActiveStudentId] = useState(studentId);
  const [question, setQuestion] = useState(
    defaultQuestion ??
      (audience === "consultant"
        ? "请根据这位学生当前的任务、截止日期、打卡和申请档案，告诉我下一次沟通最该抓什么。"
        : audience === "parent"
          ? "请根据孩子目前的进度，告诉我这周家长最该关注什么。"
          : "这周我最应该优先做什么？")
  );
  const [answer, setAnswer] = useState("");
  const [trace, setTrace] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const runChat = async () => {
    setPending(true);
    setError("");
    setCopied("");

    try {
      const payload = await jsonFetch<{
        summary: string;
        trace_id: string;
        decision_id: string;
      }>("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: activeStudentId, question, page }),
      });

      setAnswer(payload.data?.summary ?? "");
      setTrace(`${payload.trace_id} · ${payload.data?.decision_id ?? ""}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-white p-4 shadow-terra sm:rounded-3xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("AI Assistant", "AI 助手")}</p>
      <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">
        {title ?? t("Question-driven support", "随时提问的中文助手")}
      </h3>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {description ??
          t(
            "Ask naturally about planning, stress, priorities, or how to approach a task. The answer stays practical and traceable.",
            "你可以自然地问优先级、规划方法、任务推进，甚至是任务太多时怎么稳住节奏。回答会尽量具体，并保留可追踪日志。"
          )}
      </p>
      {studentOptions && studentOptions.length > 1 ? (
        <label className="mt-4 block text-sm font-semibold text-secondary">
          {t("Student context", "学生上下文")}
          <select
            value={activeStudentId}
            onChange={(event) => setActiveStudentId(event.target.value)}
            className="mt-2 w-full rounded-2xl bg-surface-container-low px-4 py-3"
          >
            {studentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.sublabel ? `${option.label} · ${option.sublabel}` : option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-4 min-h-24 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <button
        type="button"
        disabled={pending}
        onClick={runChat}
        className="mt-4 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
      >
        {pending ? t("Thinking...", "生成中...") : buttonLabel ?? t("Ask AI", "向 AI 提问")}
      </button>
      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
      {answer ? (
        <div className="mt-5 rounded-[1.15rem] bg-primary/5 p-3 text-sm leading-7 text-secondary sm:rounded-2xl sm:p-4">
          <AiDisclaimerBanner />
          <MarkdownText>{answer}</MarkdownText>
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(answer);
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runChat}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
          />
          <AiStudentFeedback />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-outline">{trace}</p>
        </div>
      ) : null}
    </div>
  );
}

export function StudentTaskBreakdownPanel({ studentId }: { studentId: string }) {
  const t = useText();
  const [goal, setGoal] = useState("比如：帮我拆解“准备暑校申请”这个任务");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [result, setResult] = useState<null | {
    title: string;
    summary: string;
    steps: string[];
    trace_id: string;
    decision_id: string;
  }>(null);

  const runBreakdown = async () => {
    setPending(true);
    setError("");
    setCopied("");

    try {
      const payload = await jsonFetch<{
        title: string;
        summary: string;
        steps: string[];
        trace_id: string;
        decision_id: string;
      }>("/api/ai/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "student_task_breakdown",
          studentId,
          page: "/student/timeline",
          text: goal,
        }),
      });

      setResult(payload.data ?? null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-white p-4 shadow-terra sm:rounded-3xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Task Breakdown", "任务拆解")}</p>
      <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">{t("Break a big task into next steps", "把大任务拆成下一步")}</h3>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {t(
          "Paste one big task and get a practical sequence you can turn into draft tasks.",
          "输入一个大任务，AI 会帮你拆成更容易执行的小步骤。当前只生成建议，不会直接改你的时间线。"
        )}
      </p>
      <textarea
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        className="mt-4 min-h-28 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <button
        type="button"
        disabled={pending}
        onClick={runBreakdown}
        className="mt-4 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
      >
        {pending ? t("Thinking...", "生成中...") : t("Break Down", "拆解任务")}
      </button>
      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
      {result ? (
        <div className="mt-5 rounded-[1.15rem] bg-primary/5 p-3 sm:rounded-2xl sm:p-4">
          <AiDisclaimerBanner />
          <p className="font-bold text-foreground">{result.title}</p>
          <MarkdownText className="mt-3 text-sm text-secondary">{result.summary}</MarkdownText>
          <div className="mt-4 space-y-3">
            {result.steps.map((step, index) => (
              <div key={`${index}-${step}`} className="flex gap-3 rounded-[1rem] bg-white px-3 py-3 sm:rounded-2xl sm:px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <MarkdownText className="text-sm text-secondary">{stripLeadingListMarker(step)}</MarkdownText>
                </div>
              </div>
            ))}
          </div>
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(
                [result.title, result.summary, "", ...result.steps.map((step, index) => `${index + 1}. ${stripLeadingListMarker(step)}`)].join("\n")
              );
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runBreakdown}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
          />
          <AiStudentFeedback />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-outline">
            {result.trace_id} · {result.decision_id}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ConsultantWeeklyReportPanel({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const t = useText();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [result, setResult] = useState<null | {
    summary: string;
    progress: string[];
    risks: string[];
    nextActions: string[];
    trace_id: string;
    decision_id: string;
  }>(null);

  const runReport = async () => {
    setPending(true);
    setError("");
    setCopied("");
    setMessage("");

    try {
      const payload = await jsonFetch<{
        summary: string;
        progress: string[];
        risks: string[];
        nextActions: string[];
        trace_id: string;
        decision_id: string;
      }>("/api/ai/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "consultant_weekly_report",
          studentId,
          page: "/consultant/students/[studentId]",
        }),
      });

      setResult(payload.data ?? null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-primary/5 p-4 sm:rounded-3xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Weekly Report", "学生周报")}</p>
      <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">{t("Single-student AI report", "单个学生 AI 周报")}</h3>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {t(
          "Generate a consultant-facing summary with progress, risks, and next actions.",
          "为顾问生成正式中文周报，帮助你快速把握进展、风险和下周动作。"
        )}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={runReport}
        className="mt-4 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
      >
        {pending ? t("Thinking...", "生成中...") : t("Generate Weekly Report", "生成周报")}
      </button>
      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-semibold text-primary">{message}</p> : null}
      {result ? (
        <div className="mt-5 rounded-[1.3rem] bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <AiDisclaimerBanner />
          <MarkdownText className="text-sm text-secondary">{result.summary}</MarkdownText>
          <AiBulletSection title={t("Progress", "本周进展")} items={result.progress} />
          <AiBulletSection title={t("Risks", "当前风险")} items={result.risks} />
          <AiBulletSection title={t("Next actions", "下周建议动作")} items={result.nextActions} />
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(buildWeeklyReportText(result));
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runReport}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
            extraAction={
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setError("");
                  setMessage("");

                  try {
                    await jsonFetch("/api/consultant/notes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        studentId,
                        title: `AI周报｜${studentName}｜${new Date().toISOString().slice(0, 10)}`,
                        summary: buildWeeklyReportText(result),
                      }),
                    });
                    setMessage(t("Saved to advisor notes.", "已保存到顾问备注。"));
                    router.refresh();
                  } catch (submissionError) {
                    setError(submissionError instanceof Error ? submissionError.message : t("Saving failed.", "保存失败。"));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-primary disabled:opacity-60"
              >
                {saving ? t("Saving...", "保存中...") : t("Save to Notes", "保存到备注")}
              </button>
            }
          />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">
            {result.trace_id} · {result.decision_id}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ConsultantMeetingSummaryPanel({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const t = useText();
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const [result, setResult] = useState<null | {
    summary: string;
    studentFeedback: string[];
    parentFeedback: string[];
    consultantAdvice: string[];
    followUps: string[];
    risks: string[];
    trace_id: string;
    decision_id: string;
  }>(null);

  const runMeetingSummary = async () => {
    setPending(true);
    setError("");
    setMessage("");
    setCopied("");

    try {
      const payload = await jsonFetch<{
        summary: string;
        studentFeedback: string[];
        parentFeedback: string[];
        consultantAdvice: string[];
        followUps: string[];
        risks: string[];
        trace_id: string;
        decision_id: string;
      }>("/api/ai/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "consultant_meeting_summary",
          studentId,
          page: "/consultant/students/[studentId]",
          text: transcript,
        }),
      });

      setResult(payload.data ?? null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-white p-4 shadow-terra sm:rounded-3xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Meeting Summary", "会议摘要")}</p>
      <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">{t("Turn transcript into structured notes", "把会议转写整理成结构化纪要")}</h3>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {t(
          "Paste transcript text from a student or parent meeting and turn it into consultant-readable notes.",
          "把你和学生、家长会议的转写文本贴进来，AI 会帮你整理成可阅读、可保存的结构化摘要。"
        )}
      </p>
      <textarea
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        placeholder={t("Paste transcript here", "把会议转写粘贴到这里")}
        className="mt-4 min-h-40 w-full rounded-2xl bg-surface-container-low px-4 py-3"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={runMeetingSummary}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
        >
          {pending ? t("Thinking...", "生成中...") : t("Generate Meeting Summary", "生成会议摘要")}
        </button>
        <button
          type="button"
          disabled={!result || saving}
          onClick={async () => {
            if (!result) return;
            setSaving(true);
            setError("");
            setMessage("");

            try {
              await jsonFetch("/api/consultant/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId,
                  title: `AI会议摘要｜${studentName}｜${new Date().toISOString().slice(0, 10)}`,
                  summary: buildMeetingNoteSummary(result),
                }),
              });
              setMessage(t("Saved to advisor notes.", "已保存到顾问备注。"));
              router.refresh();
            } catch (submissionError) {
              setError(submissionError instanceof Error ? submissionError.message : t("Saving failed.", "保存失败。"));
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-full border border-outline-variant px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60 sm:px-5 sm:py-3"
        >
          {saving ? t("Saving...", "保存中...") : t("Save to Notes", "保存到备注")}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-semibold text-primary">{message}</p> : null}
      {result ? (
        <div className="mt-5 rounded-[1.15rem] bg-primary/5 p-3 sm:rounded-2xl sm:p-4">
          <AiDisclaimerBanner />
          <MarkdownText className="text-sm text-secondary">{result.summary}</MarkdownText>
          <AiBulletSection title={t("Student feedback", "学生反馈")} items={result.studentFeedback} />
          <AiBulletSection title={t("Parent feedback", "家长反馈")} items={result.parentFeedback} />
          <AiBulletSection title={t("Consultant advice", "顾问建议")} items={result.consultantAdvice} />
          <AiBulletSection title={t("Follow-ups", "后续待办")} items={result.followUps} />
          <AiBulletSection title={t("Risks", "风险提醒")} items={result.risks} />
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(buildMeetingNoteSummary(result));
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runMeetingSummary}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">
            {result.trace_id} · {result.decision_id}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ParentWeeklySummaryPanel({ studentId }: { studentId: string }) {
  const t = useText();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [result, setResult] = useState<null | {
    summary: string;
    progress: string[];
    nextFocus: string[];
    parentSupport: string[];
    trace_id: string;
    decision_id: string;
  }>(null);

  const runParentSummary = async () => {
    setPending(true);
    setError("");
    setCopied("");

    try {
      const payload = await jsonFetch<{
        summary: string;
        progress: string[];
        nextFocus: string[];
        parentSupport: string[];
        trace_id: string;
        decision_id: string;
      }>("/api/ai/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "parent_weekly_summary",
          studentId,
          page: "/parent/dashboard",
        }),
      });

      setResult(payload.data ?? null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("AI request failed.", "AI 请求失败。"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-primary/10 bg-white p-4 shadow-terra sm:rounded-3xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t("Weekly Summary", "每周进展总结")}</p>
      <h3 className="mt-2 font-serif text-xl font-bold text-foreground sm:text-2xl">{t("Parent-facing AI summary", "家长端 AI 总结")}</h3>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
        {t(
          "Generate a calm weekly summary of progress, upcoming focus, and how the family can help.",
          "生成适合家长查看的每周进展总结，重点说明当前进展、下周重点以及家长可以提供的支持。"
        )}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={runParentSummary}
        className="mt-4 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white sm:px-5 sm:py-3"
      >
        {pending ? t("Thinking...", "生成中...") : t("Generate Summary", "生成总结")}
      </button>
      {error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
      {result ? (
        <div className="mt-5 rounded-[1.15rem] bg-primary/5 p-3 sm:rounded-2xl sm:p-4">
          <AiDisclaimerBanner />
          <MarkdownText className="text-sm text-secondary">{result.summary}</MarkdownText>
          <AiBulletSection title={t("Progress", "本周进展")} items={result.progress} />
          <AiBulletSection title={t("Next focus", "下周重点")} items={result.nextFocus} />
          <AiBulletSection title={t("How family can help", "家长可以怎么支持")} items={result.parentSupport} />
          <AiActionRow
            copiedMessage={copied}
            onCopy={async () => {
              await copyToClipboard(buildParentSummaryText(result));
              setCopied(t("Copied", "已复制"));
            }}
            onRegenerate={runParentSummary}
            regenerateLabel={t("Regenerate", "重新生成")}
            copyLabel={t("Copy", "复制内容")}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-outline">
            {result.trace_id} · {result.decision_id}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AiDisclaimerBanner() {
  return (
    <div className="mb-4 rounded-2xl bg-primary/8 px-4 py-3 text-sm leading-6 text-primary">
      {AI_DISCLAIMER}
    </div>
  );
}

function AiActionRow({
  onCopy,
  onRegenerate,
  copyLabel,
  regenerateLabel,
  copiedMessage,
  extraAction,
}: {
  onCopy: () => Promise<void> | void;
  onRegenerate: () => Promise<void> | void;
  copyLabel: string;
  regenerateLabel: string;
  copiedMessage?: string;
  extraAction?: ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onCopy}
        className="rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-bold text-primary sm:px-4 sm:py-2 sm:text-xs"
      >
        {copyLabel}
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        className="rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-bold text-primary sm:px-4 sm:py-2 sm:text-xs"
      >
        {regenerateLabel}
      </button>
      {extraAction}
      {copiedMessage ? <span className="text-xs font-semibold text-primary">{copiedMessage}</span> : null}
    </div>
  );
}

function AiStudentFeedback() {
  const t = useText();
  const [value, setValue] = useState<"helpful" | "not_helpful" | null>(null);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-outline sm:text-xs sm:tracking-[0.18em]">
        {t("Quick feedback", "快速反馈")}
      </span>
      <button
        type="button"
        onClick={() => setValue("helpful")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors sm:px-4 sm:py-2 sm:text-xs",
          value === "helpful" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-primary"
        )}
      >
        {t("Helpful", "有帮助")}
      </button>
      <button
        type="button"
        onClick={() => setValue("not_helpful")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors sm:px-4 sm:py-2 sm:text-xs",
          value === "not_helpful" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-primary"
        )}
      >
        {t("Needs work", "还不够好")}
      </button>
    </div>
  );
}

function AiBulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}-${item}`} className="rounded-[1rem] bg-surface-container-low px-3 py-3 sm:rounded-2xl sm:px-4">
            <MarkdownText className="text-sm text-secondary">{item}</MarkdownText>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarkdownText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("leading-7", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.95em] text-foreground">{children}</code>
          ),
          pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-2xl bg-black/5 p-4 text-sm">{children}</pre>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-primary/30 pl-4 text-secondary">{children}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function buildMeetingNoteSummary(result: {
  summary: string;
  studentFeedback: string[];
  parentFeedback: string[];
  consultantAdvice: string[];
  followUps: string[];
  risks: string[];
}) {
  return [
    `会议总结：${result.summary}`,
    "",
    `学生反馈：${result.studentFeedback.join("；") || "未明确提及"}`,
    `家长反馈：${result.parentFeedback.join("；") || "未明确提及"}`,
    `顾问建议：${result.consultantAdvice.join("；") || "未明确提及"}`,
    `后续待办：${result.followUps.join("；") || "未明确提及"}`,
    `风险提醒：${result.risks.join("；") || "未明确提及"}`,
  ].join("\n");
}

function buildWeeklyReportText(result: {
  summary: string;
  progress: string[];
  risks: string[];
  nextActions: string[];
}) {
  return [
    `周报总结：${result.summary}`,
    "",
    `本周进展：${result.progress.join("；") || "未明确提及"}`,
    `当前风险：${result.risks.join("；") || "未明确提及"}`,
    `下周建议动作：${result.nextActions.join("；") || "未明确提及"}`,
  ].join("\n");
}

function buildParentSummaryText(result: {
  summary: string;
  progress: string[];
  nextFocus: string[];
  parentSupport: string[];
}) {
  return [
    `每周总结：${result.summary}`,
    "",
    `本周进展：${result.progress.join("；") || "未明确提及"}`,
    `下周重点：${result.nextFocus.join("；") || "未明确提及"}`,
    `家长支持建议：${result.parentSupport.join("；") || "未明确提及"}`,
  ].join("\n");
}

async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}

function normalizeStudentPhase(value: string): StudentPhaseValue {
  const normalized = value.trim().toLowerCase();

  if (normalized === "application") return "Application";
  if (normalized === "submission") return "Submission";
  if (normalized === "decision") return "Decision";
  if (normalized === "visa") return "Visa";
  if (normalized === "planning" || normalized === "research") return "Planning";

  return "Planning";
}

function stripLeadingListMarker(value: string) {
  return value.replace(/^\s*\d+\.\s+/, "").trim();
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
        className="min-h-24 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="rounded-full border border-outline-variant px-3 py-2 text-[11px] font-bold text-primary sm:text-xs"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("End date", "结束日期")}
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button disabled={pending} className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm">
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
        className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
        placeholder={t("Deadline title", "截止日期标题")}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-secondary">
          {t("Date", "日期")}
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          />
        </label>
        <label className="text-sm font-semibold text-secondary">
          {t("Status", "状态")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Milestone["status"])}
            className="mt-2 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <option value="upcoming">{t("upcoming", "待开始")}</option>
            <option value="done">{t("done", "已完成")}</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button disabled={pending} className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm">
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
  defaultPhase,
  defaultCountries,
  defaultDreamSchools,
  defaultMajor,
}: {
  studentId: string;
  defaultGrade: string;
  defaultSchool: string;
  defaultPhase: string;
  defaultCountries: string[];
  defaultDreamSchools: string[];
  defaultMajor: string;
}) {
  const t = useText();
  const [grade, setGrade] = useState(defaultGrade);
  const [schoolName, setSchoolName] = useState(defaultSchool);
  const [phase, setPhase] = useState<StudentPhaseValue>(normalizeStudentPhase(defaultPhase));
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
            phase,
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
        <input value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" placeholder={t("Current grade", "当前年级")} />
        <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" placeholder={t("Current school", "当前学校")} />
      </div>
      <select
        aria-label="Current phase"
        value={phase}
        onChange={(event) => setPhase(event.target.value as StudentPhaseValue)}
        className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm font-medium text-foreground sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
      >
        {studentPhaseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input value={countries} onChange={(event) => setCountries(event.target.value)} className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" placeholder={t("Target countries", "目标国家")} />
      <input value={schools} onChange={(event) => setSchools(event.target.value)} className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" placeholder={t("Dream schools", "梦校")} />
      <input value={major} onChange={(event) => setMajor(event.target.value)} className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3" placeholder={t("Intended major", "意向专业")} />
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white sm:px-5 sm:py-3 sm:text-sm">{t("Save Student Profile", "保存学生资料")}</button>
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
        className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
        placeholder={t("Note title", "备注标题")}
      />
      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        className="min-h-24 w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
        placeholder={t("Consultant note summary", "顾问备注摘要")}
      />
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button disabled={pending} className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-70 sm:px-5 sm:py-3 sm:text-sm">
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
        className="w-full rounded-xl bg-surface-container-low px-3 py-2.5 text-sm sm:rounded-2xl sm:px-4 sm:py-3"
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
              "rounded-xl px-3 py-2 text-xs font-semibold sm:rounded-2xl sm:text-sm",
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
              "block rounded-2xl border px-3 py-3 transition-all sm:px-4 sm:py-4",
              student.id === currentStudentId
                ? "border-primary bg-primary/5 shadow-terra"
                : "border-black/5 bg-white hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">{student.name}</p>
                <p className="mt-1 text-xs text-secondary sm:text-sm">
                  {student.grade} · {student.school}
                </p>
              </div>
              <div className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-primary sm:text-xs">
                {student.completion}%
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.18em]",
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
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-outline sm:text-xs sm:tracking-[0.2em]">
                {student.phase}
              </span>
            </div>
            <div className="mt-3 rounded-2xl bg-surface-container-low px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs sm:tracking-[0.2em]">{t("Next deadline", "下一个截止日期")}</p>
              <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">{student.nextDeadlineTitle}</p>
              <p className="mt-1 text-xs text-secondary">{student.nextDeadlineLabel}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

type ContentDraft = {
  type: ContentItem["type"];
  title: string;
  subtitle: string;
  country: string;
  tags: string;
  difficulty: ContentItem["difficulty"];
  schoolRanking: string;
  schoolCity: string;
  schoolTuition: string;
  schoolAcceptanceRate: string;
  majorDegree: string;
  majorStemEligible: boolean;
  majorBackground: string;
  majorCareerPaths: string;
  competitionOrganizer: string;
  competitionEligibility: string;
  competitionAward: string;
  competitionSeason: string;
  courseProvider: string;
  courseFormat: NonNullable<ContentItem["courseDetails"]>["format"];
  courseDurationWeeks: string;
  courseWorkload: string;
  chapterCurriculum: string;
  chapterSequence: string;
  chapterEstimatedHours: string;
  chapterKeySkill: string;
};

function createDefaultContentDraft(): ContentDraft {
  return {
    type: "competition",
    title: "Global Sustainability Lab",
    subtitle: "Project-based environmental research",
    country: "Global",
    tags: "Research, Sustainability",
    difficulty: "Match",
    schoolRanking: "",
    schoolCity: "",
    schoolTuition: "",
    schoolAcceptanceRate: "",
    majorDegree: "BS",
    majorStemEligible: true,
    majorBackground: "",
    majorCareerPaths: "",
    competitionOrganizer: "",
    competitionEligibility: "",
    competitionAward: "",
    competitionSeason: "",
    courseProvider: "",
    courseFormat: "Online",
    courseDurationWeeks: "",
    courseWorkload: "",
    chapterCurriculum: "",
    chapterSequence: "",
    chapterEstimatedHours: "",
    chapterKeySkill: "",
  };
}

function createContentDraftFromItem(item: ContentItem): ContentDraft {
  return {
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    country: item.country ?? "",
    tags: item.tags.join(", "),
    difficulty: item.difficulty,
    schoolRanking:
      item.schoolDetails?.ranking != null ? String(item.schoolDetails.ranking) : "",
    schoolCity: item.schoolDetails?.city ?? "",
    schoolTuition:
      item.schoolDetails?.tuitionUsd != null ? String(item.schoolDetails.tuitionUsd) : "",
    schoolAcceptanceRate: item.schoolDetails?.acceptanceRate ?? "",
    majorDegree: item.majorDetails?.degree ?? "BS",
    majorStemEligible: item.majorDetails?.stemEligible ?? true,
    majorBackground: item.majorDetails?.recommendedBackground ?? "",
    majorCareerPaths: item.majorDetails?.careerPaths?.join(", ") ?? "",
    competitionOrganizer: item.competitionDetails?.organizer ?? "",
    competitionEligibility: item.competitionDetails?.eligibility ?? "",
    competitionAward: item.competitionDetails?.award ?? "",
    competitionSeason: item.competitionDetails?.season ?? "",
    courseProvider: item.courseDetails?.provider ?? "",
    courseFormat: item.courseDetails?.format ?? "Online",
    courseDurationWeeks:
      item.courseDetails?.durationWeeks != null ? String(item.courseDetails.durationWeeks) : "",
    courseWorkload: item.courseDetails?.workload ?? "",
    chapterCurriculum: item.chapterDetails?.curriculum ?? "",
    chapterSequence: item.chapterDetails?.sequence ?? "",
    chapterEstimatedHours:
      item.chapterDetails?.estimatedHours != null
        ? String(item.chapterDetails.estimatedHours)
        : "",
    chapterKeySkill: item.chapterDetails?.keySkill ?? "",
  };
}

function buildContentPayload(draft: ContentDraft) {
  return {
    type: draft.type,
    title: draft.title,
    subtitle: draft.subtitle,
    country: draft.country || undefined,
    tags: splitCommaValue(draft.tags),
    difficulty: draft.difficulty,
    status: "published" as const,
    schoolDetails:
      draft.type === "school"
        ? {
            ranking: draft.schoolRanking.trim() || undefined,
            city: draft.schoolCity || undefined,
            tuitionUsd: parseOptionalNumber(draft.schoolTuition),
            acceptanceRate: draft.schoolAcceptanceRate || undefined,
          }
        : undefined,
    majorDetails:
      draft.type === "major"
        ? {
            degree: draft.majorDegree || undefined,
            stemEligible: draft.majorStemEligible,
            recommendedBackground: draft.majorBackground || undefined,
            careerPaths: splitCommaValue(draft.majorCareerPaths),
          }
        : undefined,
    competitionDetails:
      draft.type === "competition"
        ? {
            organizer: draft.competitionOrganizer || undefined,
            eligibility: draft.competitionEligibility || undefined,
            award: draft.competitionAward || undefined,
            season: draft.competitionSeason || undefined,
          }
        : undefined,
    courseDetails:
      draft.type === "course"
        ? {
            provider: draft.courseProvider || undefined,
            format: draft.courseFormat || undefined,
            durationWeeks: parseOptionalNumber(draft.courseDurationWeeks),
            workload: draft.courseWorkload || undefined,
          }
        : undefined,
    chapterDetails:
      draft.type === "chapter"
        ? {
            curriculum: draft.chapterCurriculum || undefined,
            sequence: draft.chapterSequence || undefined,
            estimatedHours: parseOptionalNumber(draft.chapterEstimatedHours),
            keySkill: draft.chapterKeySkill || undefined,
          }
        : undefined,
  };
}

function ContentItemFields({
  draft,
  setDraft,
}: {
  draft: ContentDraft;
  setDraft: Dispatch<SetStateAction<ContentDraft>>;
}) {
  const t = useText();

  const setField = <K extends keyof ContentDraft>(field: K, value: ContentDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <input
        value={draft.title}
        onChange={(event) => setField("title", event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Title", "标题")}
        required
      />
      <input
        value={draft.subtitle}
        onChange={(event) => setField("subtitle", event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Subtitle", "副标题")}
        required
      />
      <select
        value={draft.type}
        onChange={(event) => setField("type", event.target.value as ContentItem["type"])}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
      >
        <option value="course">{t("Course", "课程")}</option>
        <option value="chapter">{t("Chapter", "章节")}</option>
        <option value="competition">{t("Competition", "竞赛")}</option>
        <option value="school">{t("School", "学校")}</option>
        <option value="major">{t("Major", "专业")}</option>
      </select>
      <input
        value={draft.country}
        onChange={(event) => setField("country", event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
        placeholder={t("Country", "国家")}
      />
      <input
        value={draft.tags}
        onChange={(event) => setField("tags", event.target.value)}
        className="rounded-2xl bg-surface-container-low px-4 py-3 md:col-span-2"
        placeholder={t("Tags, separated by commas", "标签，用逗号分隔")}
      />
      <select
        value={draft.difficulty}
        onChange={(event) => setField("difficulty", event.target.value as ContentItem["difficulty"])}
        className="rounded-2xl bg-surface-container-low px-4 py-3"
      >
        <option value="Safety">{t("Safety", "保底")}</option>
        <option value="Match">{t("Match", "匹配")}</option>
        <option value="Reach">{t("Reach", "冲刺")}</option>
      </select>
      {draft.type === "school" ? (
        <>
          <input
            value={draft.schoolRanking}
            onChange={(event) => setField("schoolRanking", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Ranking", "排名")}
          />
          <input
            value={draft.schoolCity}
            onChange={(event) => setField("schoolCity", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("City", "城市")}
          />
          <input
            value={draft.schoolTuition}
            onChange={(event) => setField("schoolTuition", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Tuition (USD)", "学费（美元）")}
          />
          <input
            value={draft.schoolAcceptanceRate}
            onChange={(event) => setField("schoolAcceptanceRate", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Acceptance rate", "录取率")}
          />
        </>
      ) : null}
      {draft.type === "major" ? (
        <>
          <input
            value={draft.majorDegree}
            onChange={(event) => setField("majorDegree", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Degree", "学位")}
          />
          <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-secondary">
            <input
              type="checkbox"
              checked={draft.majorStemEligible}
              onChange={(event) => setField("majorStemEligible", event.target.checked)}
            />
            {t("STEM eligible", "STEM 专业")}
          </label>
          <input
            value={draft.majorBackground}
            onChange={(event) => setField("majorBackground", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3 md:col-span-2"
            placeholder={t("Recommended background", "推荐学科背景")}
          />
          <input
            value={draft.majorCareerPaths}
            onChange={(event) => setField("majorCareerPaths", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3 md:col-span-2"
            placeholder={t("Career paths, separated by commas", "就业方向，用逗号分隔")}
          />
        </>
      ) : null}
      {draft.type === "competition" ? (
        <>
          <input
            value={draft.competitionOrganizer}
            onChange={(event) => setField("competitionOrganizer", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Organizer", "主办方")}
          />
          <input
            value={draft.competitionEligibility}
            onChange={(event) => setField("competitionEligibility", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Eligibility", "参赛要求")}
          />
          <input
            value={draft.competitionAward}
            onChange={(event) => setField("competitionAward", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Award / outcome", "奖项说明")}
          />
          <input
            value={draft.competitionSeason}
            onChange={(event) => setField("competitionSeason", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Season", "赛季")}
          />
        </>
      ) : null}
      {draft.type === "course" ? (
        <>
          <input
            value={draft.courseProvider}
            onChange={(event) => setField("courseProvider", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Provider", "提供方")}
          />
          <select
            value={draft.courseFormat}
            onChange={(event) =>
              setField(
                "courseFormat",
                event.target.value as NonNullable<ContentItem["courseDetails"]>["format"]
              )
            }
            className="rounded-2xl bg-surface-container-low px-4 py-3"
          >
            <option value="Online">{t("Online", "线上")}</option>
            <option value="Offline">{t("Offline", "线下")}</option>
            <option value="Hybrid">{t("Hybrid", "混合")}</option>
          </select>
          <input
            value={draft.courseDurationWeeks}
            onChange={(event) => setField("courseDurationWeeks", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Duration (weeks)", "周期（周）")}
          />
          <input
            value={draft.courseWorkload}
            onChange={(event) => setField("courseWorkload", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Workload", "学习强度")}
          />
        </>
      ) : null}
      {draft.type === "chapter" ? (
        <>
          <input
            value={draft.chapterCurriculum}
            onChange={(event) => setField("chapterCurriculum", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Curriculum", "所属课程")}
          />
          <input
            value={draft.chapterSequence}
            onChange={(event) => setField("chapterSequence", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Sequence", "章节顺序")}
          />
          <input
            value={draft.chapterEstimatedHours}
            onChange={(event) => setField("chapterEstimatedHours", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Estimated hours", "预计时长（小时）")}
          />
          <input
            value={draft.chapterKeySkill}
            onChange={(event) => setField("chapterKeySkill", event.target.value)}
            className="rounded-2xl bg-surface-container-low px-4 py-3"
            placeholder={t("Key skill", "核心能力")}
          />
        </>
      ) : null}
    </div>
  );
}

export function ContentItemComposer() {
  const t = useText();
  const router = useRouter();
  const [draft, setDraft] = useState<ContentDraft>(() => createDefaultContentDraft());
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        try {
          await jsonFetch("/api/content/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildContentPayload(draft)),
          });
          setMessage(t("Manual content item created.", "内容条目已创建。"));
          setDraft(createDefaultContentDraft());
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : t("Failed to create content item.", "创建内容失败。")
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <ContentItemFields draft={draft} setDraft={setDraft} />
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={pending}
        >
          {pending ? t("Creating...", "创建中...") : t("Create Content", "创建内容")}
        </button>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
    </form>
  );
}

function ContentItemEditor({
  item,
  onSaved,
  onCancel,
}: {
  item: ContentItem;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useText();
  const router = useRouter();
  const [draft, setDraft] = useState<ContentDraft>(() => createContentDraftFromItem(item));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft(createContentDraftFromItem(item));
    setMessage("");
  }, [item]);

  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-foreground">
            {t("Edit content item", "编辑内容")}
          </h4>
          <p className="text-sm text-secondary">
            {t(`Now editing ${item.title}`, `正在编辑：${item.title}`)}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-secondary"
          onClick={onCancel}
        >
          {t("Close", "关闭")}
        </button>
      </div>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");
          try {
            await jsonFetch(`/api/content/items/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildContentPayload(draft)),
            });
            setMessage(t("Content item updated.", "内容已更新。"));
            router.refresh();
            onSaved();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : t("Failed to update content item.", "更新内容失败。")
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <ContentItemFields draft={draft} setDraft={setDraft} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending}
          >
            {pending ? t("Saving...", "保存中...") : t("Save Changes", "保存修改")}
          </button>
          <button
            type="button"
            className="rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold text-secondary"
            onClick={onCancel}
          >
            {t("Cancel", "取消")}
          </button>
          {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
        </div>
      </form>
    </div>
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

export function ContentCategoryTables({ items }: { items: ContentItem[] }) {
  const t = useText();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("smart");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();

  const availableTags = Array.from(new Set(items.flatMap((item) => item.tags))).sort((left, right) =>
    left.localeCompare(right)
  );

  const filteredItems = items
    .filter((item) => {
      const matchesQuery = `${item.title} ${item.subtitle} ${item.tags.join(" ")} ${item.country ?? ""}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      const matchesTag = tagFilter === "all" || item.tags.includes(tagFilter);
      return matchesQuery && matchesSource && matchesTag;
    })
    .slice()
    .sort((left, right) => sortManagedContentItems(left, right, sortBy));

  const visibleIds = filteredItems.map((item) => item.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((itemId) => selectedIds.includes(itemId));
  const editingItem = items.find((item) => item.id === editingItemId) ?? null;

  useEffect(() => {
    if (editingItemId && !items.some((item) => item.id === editingItemId)) {
      setEditingItemId(null);
    }
  }, [editingItemId, items]);

  const deleteItems = async (ids: string[]) => {
    setPendingDelete(true);
    setMessage("");
    try {
      const countToDelete = ids.length;
      await jsonFetch<{ count: number; ids: string[] }>("/api/content/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSelectedIds((current) => current.filter((itemId) => !ids.includes(itemId)));
      setMessage(
        t(
          `Deleted ${countToDelete} content items.`,
          `已删除 ${countToDelete} 条内容。`
        )
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : t("Delete failed.", "删除失败。")
      );
    } finally {
      setPendingDelete(false);
    }
  };

  const sections = contentTypeOrder
    .map((type) => ({
      type,
      items: filteredItems.filter((item) => item.type === type),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Search content titles, subtitles, and tags...", "搜索内容标题、副标题和标签...")}
        />
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="all">{t("All sources", "全部来源")}</option>
          <option value="manual">{t("Manual", "手动录入")}</option>
          <option value="import">{t("Import", "导入")}</option>
        </select>
        <select
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="all">{t("All tags", "全部标签")}</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="smart">{t("Sort: smart", "排序：智能")}</option>
          <option value="title">{t("Sort: title", "排序：标题")}</option>
          <option value="difficulty">{t("Sort: difficulty", "排序：难度")}</option>
          <option value="source">{t("Sort: source", "排序：来源")}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-secondary"
          onClick={() =>
            setSelectedIds((current) =>
              allVisibleSelected
                ? current.filter((itemId) => !visibleIds.includes(itemId))
                : Array.from(new Set([...current, ...visibleIds]))
            )
          }
        >
          {allVisibleSelected
            ? t("Clear visible selection", "取消当前筛选结果选择")
            : t("Select visible rows", "选中当前筛选结果")}
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0 || pendingDelete}
          className="rounded-full bg-error px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          onClick={() => void deleteItems(selectedIds)}
        >
          {pendingDelete
            ? t("Deleting...", "删除中...")
            : t("Delete selected", "删除选中项")}
        </button>
        <p className="text-sm font-semibold text-secondary">
          {t(
            `${filteredItems.length} items shown · ${selectedIds.length} selected`,
            `当前显示 ${filteredItems.length} 条 · 已选中 ${selectedIds.length} 条`
          )}
        </p>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>

      {sections.map((section) => (
        <div
          key={section.type}
          className="space-y-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {contentTypeLabel(section.type, t)}
              </h3>
              <p className="text-sm text-secondary">
                {t(
                  `${section.items.length} items in this category`,
                  `该分类下共有 ${section.items.length} 条内容`
                )}
              </p>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {renderManagedContentCards({
              type: section.type,
              items: section.items,
              selectedIds,
              setSelectedIds,
              editingItemId,
              setEditingItemId,
              t,
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            {renderManagedContentTable({
              type: section.type,
              items: section.items,
              selectedIds,
              setSelectedIds,
              editingItemId,
              setEditingItemId,
              t,
            })}
          </div>
          {editingItem?.type === section.type ? (
            <ContentItemEditor
              key={editingItem.id}
              item={editingItem}
              onCancel={() => setEditingItemId(null)}
              onSaved={() => {
                setEditingItemId(null);
                setMessage(t("Content item updated.", "内容已更新。"));
              }}
            />
          ) : null}
        </div>
      ))}

      {sections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant px-6 py-10 text-center text-sm font-medium text-secondary">
          {t("No content matches the current filters.", "当前筛选条件下没有内容。")}
        </div>
      ) : null}
    </div>
  );
}

export function AnalyticsExportButton() {
  const t = useText();
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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

const contentTypeOrder = ["school", "major", "competition", "course", "chapter"] as const;

function contentTypeLabel(type: ContentItem["type"], t: ReturnType<typeof useText>) {
  switch (type) {
    case "school":
      return t("Schools", "学校");
    case "major":
      return t("Majors", "专业");
    case "competition":
      return t("Competitions", "竞赛");
    case "course":
      return t("Courses", "课程");
    case "chapter":
      return t("Chapters", "章节");
    default:
      return type;
  }
}

function sortManagedContentItems(left: ContentItem, right: ContentItem, sortBy: string) {
  if (sortBy === "title") {
    return left.title.localeCompare(right.title);
  }

  if (sortBy === "difficulty") {
    return compareDifficulty(left.difficulty, right.difficulty) || left.title.localeCompare(right.title);
  }

  if (sortBy === "source") {
    return left.source.localeCompare(right.source) || left.title.localeCompare(right.title);
  }

  if (left.type === "school" && right.type === "school") {
    return compareRanking(left, right) || left.title.localeCompare(right.title);
  }

  return left.type.localeCompare(right.type) || left.title.localeCompare(right.title);
}

function renderManagedContentCards({
  type,
  items,
  selectedIds,
  setSelectedIds,
  editingItemId,
  setEditingItemId,
  t,
}: {
  type: ContentItem["type"];
  items: ContentItem[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  editingItemId: string | null;
  setEditingItemId: Dispatch<SetStateAction<string | null>>;
  t: ReturnType<typeof useText>;
}) {
  return items.map((item) => {
    const details = renderManagedContentCardDetails(item, t);

    return (
      <div key={item.id} className="rounded-[24px] border border-black/5 bg-surface-container-low p-4">
        <div className="flex items-start justify-between gap-3">
          <label className="flex min-w-0 items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={selectedIds.includes(item.id)}
              onChange={(event) =>
                setSelectedIds((current) =>
                  event.target.checked
                    ? [...current, item.id]
                    : current.filter((itemId) => itemId !== item.id)
                )
              }
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-6 text-secondary">{item.subtitle}</p>
            </div>
          </label>
          <button
            type="button"
            className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
            onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
          >
            {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-secondary">
            {contentTypeLabel(type, t)}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-secondary">
            {item.difficulty}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary">
            {item.source}
          </span>
        </div>

        {details.length ? (
          <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-3">
            {details.map((detail) => (
              <div key={`${item.id}-${detail.label}`} className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary/70">
                  {detail.label}
                </span>
                <span className="text-right text-sm text-foreground">{detail.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {item.tags.length ? <div className="mt-3">{renderTagChips(item.tags)}</div> : null}
      </div>
    );
  });
}

function renderManagedContentCardDetails(item: ContentItem, t: ReturnType<typeof useText>) {
  const details: { label: string; value: string }[] = [];

  if (item.type === "school") {
    if (item.country) details.push({ label: t("Country", "国家"), value: item.country });
    if (item.schoolDetails?.ranking) details.push({ label: t("Ranking", "排名"), value: item.schoolDetails.ranking });
    if (item.schoolDetails?.city) details.push({ label: t("City", "城市"), value: item.schoolDetails.city });
    const tuition = formatSchoolTuition(item.schoolDetails?.tuitionUsd);
    if (tuition) details.push({ label: t("Tuition", "学费"), value: tuition });
    const rate = formatAcceptanceRate(item.schoolDetails?.acceptanceRate);
    if (rate) details.push({ label: t("Acceptance", "录取率"), value: rate });
  }

  if (item.type === "major") {
    if (item.majorDetails?.degree) details.push({ label: t("Degree", "学位"), value: item.majorDetails.degree });
    if (item.majorDetails?.stemEligible) details.push({ label: t("Track", "方向"), value: "STEM" });
    if (item.majorDetails?.recommendedBackground) {
      details.push({ label: t("Background", "推荐背景"), value: item.majorDetails.recommendedBackground });
    }
    if (item.majorDetails?.careerPaths?.length) {
      details.push({ label: t("Careers", "就业方向"), value: item.majorDetails.careerPaths.join(", ") });
    }
  }

  if (item.type === "competition") {
    if (item.competitionDetails?.organizer) details.push({ label: t("Organizer", "主办方"), value: item.competitionDetails.organizer });
    if (item.competitionDetails?.eligibility) details.push({ label: t("Eligibility", "参赛要求"), value: item.competitionDetails.eligibility });
    if (item.competitionDetails?.award) details.push({ label: t("Award", "奖项"), value: item.competitionDetails.award });
    if (item.competitionDetails?.season) details.push({ label: t("Season", "赛季"), value: item.competitionDetails.season });
  }

  if (item.type === "course") {
    if (item.courseDetails?.provider) details.push({ label: t("Provider", "提供方"), value: item.courseDetails.provider });
    if (item.courseDetails?.format) details.push({ label: t("Format", "形式"), value: item.courseDetails.format });
    if (item.courseDetails?.durationWeeks != null) {
      details.push({ label: t("Duration", "周期"), value: t(`${item.courseDetails.durationWeeks} weeks`, `${item.courseDetails.durationWeeks} 周`) });
    }
    if (item.courseDetails?.workload) details.push({ label: t("Workload", "学习强度"), value: item.courseDetails.workload });
  }

  if (item.type === "chapter") {
    if (item.chapterDetails?.curriculum) details.push({ label: t("Curriculum", "所属课程"), value: item.chapterDetails.curriculum });
    if (item.chapterDetails?.sequence) details.push({ label: t("Sequence", "顺序"), value: item.chapterDetails.sequence });
    if (item.chapterDetails?.estimatedHours != null) {
      details.push({ label: t("Hours", "时长"), value: t(`${item.chapterDetails.estimatedHours} hours`, `${item.chapterDetails.estimatedHours} 小时`) });
    }
    if (item.chapterDetails?.keySkill) details.push({ label: t("Key Skill", "核心能力"), value: item.chapterDetails.keySkill });
  }

  return details;
}

function renderManagedContentTable({
  type,
  items,
  selectedIds,
  setSelectedIds,
  editingItemId,
  setEditingItemId,
  t,
}: {
  type: ContentItem["type"];
  items: ContentItem[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  editingItemId: string | null;
  setEditingItemId: Dispatch<SetStateAction<string | null>>;
  t: ReturnType<typeof useText>;
}) {
  if (type === "school") {
    return (
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-surface-container-low text-secondary">
          <tr>
            <th className="px-4 py-3" />
            <th className="px-4 py-3">{t("School", "学校")}</th>
            <th className="px-4 py-3">{t("Country", "国家")}</th>
            <th className="px-4 py-3">{t("Ranking", "排名")}</th>
            <th className="px-4 py-3">{t("City", "城市")}</th>
            <th className="px-4 py-3">{t("Tuition", "学费")}</th>
            <th className="px-4 py-3">{t("Acceptance Rate", "录取率")}</th>
            <th className="px-4 py-3">{t("Tags", "标签")}</th>
            <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
            <th className="px-4 py-3">{t("Source", "来源")}</th>
            <th className="px-4 py-3">{t("Edit", "编辑")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-black/5">
              <td className="px-4 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((itemId) => itemId !== item.id)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-secondary">{item.subtitle}</p>
              </td>
              <td className="px-4 py-3 text-secondary">{item.country ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">
                {renderSchoolRanking(item.schoolDetails?.ranking, t)}
              </td>
              <td className="px-4 py-3 text-secondary">
                {renderSchoolInfoChip(item.schoolDetails?.city, "neutral")}
              </td>
              <td className="px-4 py-3 text-secondary">
                {renderSchoolInfoChip(formatSchoolTuition(item.schoolDetails?.tuitionUsd), "primary")}
              </td>
              <td className="px-4 py-3 text-secondary">
                {renderSchoolInfoChip(formatAcceptanceRate(item.schoolDetails?.acceptanceRate), "success")}
              </td>
              <td className="px-4 py-3">{renderTagChips(item.tags)}</td>
              <td className="px-4 py-3">{item.difficulty}</td>
              <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
                  onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
                >
                  {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "major") {
    return (
      <table className="min-w-[1080px] w-full text-left text-sm">
        <thead className="bg-surface-container-low text-secondary">
          <tr>
            <th className="px-4 py-3" />
            <th className="px-4 py-3">{t("Major", "专业")}</th>
            <th className="px-4 py-3">{t("Degree", "学位")}</th>
            <th className="px-4 py-3">{t("STEM", "STEM")}</th>
            <th className="px-4 py-3">{t("Recommended Background", "推荐背景")}</th>
            <th className="px-4 py-3">{t("Career Paths", "就业方向")}</th>
            <th className="px-4 py-3">{t("Tags", "标签")}</th>
            <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
            <th className="px-4 py-3">{t("Source", "来源")}</th>
            <th className="px-4 py-3">{t("Edit", "编辑")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-black/5">
              <td className="px-4 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((itemId) => itemId !== item.id)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-secondary">{item.subtitle}</p>
              </td>
              <td className="px-4 py-3 text-secondary">{item.majorDetails?.degree ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.majorDetails?.stemEligible ? "Yes" : "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.majorDetails?.recommendedBackground ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">
                {item.majorDetails?.careerPaths?.length ? item.majorDetails.careerPaths.join(", ") : "—"}
              </td>
              <td className="px-4 py-3">{renderTagChips(item.tags)}</td>
              <td className="px-4 py-3">{item.difficulty}</td>
              <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
                  onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
                >
                  {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "competition") {
    return (
      <table className="min-w-[1080px] w-full text-left text-sm">
        <thead className="bg-surface-container-low text-secondary">
          <tr>
            <th className="px-4 py-3" />
            <th className="px-4 py-3">{t("Competition", "竞赛")}</th>
            <th className="px-4 py-3">{t("Organizer", "主办方")}</th>
            <th className="px-4 py-3">{t("Eligibility", "参赛要求")}</th>
            <th className="px-4 py-3">{t("Award", "奖项")}</th>
            <th className="px-4 py-3">{t("Season", "赛季")}</th>
            <th className="px-4 py-3">{t("Country", "国家")}</th>
            <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
            <th className="px-4 py-3">{t("Source", "来源")}</th>
            <th className="px-4 py-3">{t("Edit", "编辑")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-black/5">
              <td className="px-4 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((itemId) => itemId !== item.id)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-secondary">{item.subtitle}</p>
              </td>
              <td className="px-4 py-3 text-secondary">{item.competitionDetails?.organizer ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.competitionDetails?.eligibility ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.competitionDetails?.award ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.competitionDetails?.season ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.country ?? "—"}</td>
              <td className="px-4 py-3">{item.difficulty}</td>
              <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
                  onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
                >
                  {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === "course") {
    return (
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-surface-container-low text-secondary">
          <tr>
            <th className="px-4 py-3" />
            <th className="px-4 py-3">{t("Course", "课程")}</th>
            <th className="px-4 py-3">{t("Provider", "提供方")}</th>
            <th className="px-4 py-3">{t("Format", "形式")}</th>
            <th className="px-4 py-3">{t("Duration", "周期")}</th>
            <th className="px-4 py-3">{t("Workload", "学习强度")}</th>
            <th className="px-4 py-3">{t("Tags", "标签")}</th>
            <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
            <th className="px-4 py-3">{t("Source", "来源")}</th>
            <th className="px-4 py-3">{t("Edit", "编辑")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-black/5">
              <td className="px-4 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((itemId) => itemId !== item.id)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-secondary">{item.subtitle}</p>
              </td>
              <td className="px-4 py-3 text-secondary">{item.courseDetails?.provider ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">{item.courseDetails?.format ?? "—"}</td>
              <td className="px-4 py-3 text-secondary">
                {item.courseDetails?.durationWeeks != null ? `${item.courseDetails.durationWeeks}w` : "—"}
              </td>
              <td className="px-4 py-3 text-secondary">{item.courseDetails?.workload ?? "—"}</td>
              <td className="px-4 py-3">{renderTagChips(item.tags)}</td>
              <td className="px-4 py-3">{item.difficulty}</td>
              <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
                  onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
                >
                  {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="min-w-[980px] w-full text-left text-sm">
      <thead className="bg-surface-container-low text-secondary">
        <tr>
          <th className="px-4 py-3" />
          <th className="px-4 py-3">{t("Chapter", "章节")}</th>
          <th className="px-4 py-3">{t("Curriculum", "所属课程")}</th>
          <th className="px-4 py-3">{t("Sequence", "顺序")}</th>
          <th className="px-4 py-3">{t("Estimated Hours", "预计时长")}</th>
          <th className="px-4 py-3">{t("Key Skill", "核心能力")}</th>
          <th className="px-4 py-3">{t("Tags", "标签")}</th>
          <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
          <th className="px-4 py-3">{t("Source", "来源")}</th>
          <th className="px-4 py-3">{t("Edit", "编辑")}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t border-black/5">
            <td className="px-4 py-3 align-top">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(event) =>
                  setSelectedIds((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((itemId) => itemId !== item.id)
                  )
                }
              />
            </td>
            <td className="px-4 py-3">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-secondary">{item.subtitle}</p>
            </td>
            <td className="px-4 py-3 text-secondary">{item.chapterDetails?.curriculum ?? "—"}</td>
            <td className="px-4 py-3 text-secondary">{item.chapterDetails?.sequence ?? "—"}</td>
            <td className="px-4 py-3 text-secondary">
              {item.chapterDetails?.estimatedHours != null ? `${item.chapterDetails.estimatedHours}h` : "—"}
            </td>
            <td className="px-4 py-3 text-secondary">{item.chapterDetails?.keySkill ?? "—"}</td>
            <td className="px-4 py-3">{renderTagChips(item.tags)}</td>
            <td className="px-4 py-3">{item.difficulty}</td>
            <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
            <td className="px-4 py-3">
              <button
                type="button"
                className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-secondary"
                onClick={() => setEditingItemId((current) => (current === item.id ? null : item.id))}
              >
                {editingItemId === item.id ? t("Editing", "编辑中") : t("Edit", "编辑")}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderTagChips(tags: string[]) {
  if (tags.length === 0) {
    return <span className="text-secondary">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-secondary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ContentFilterTable({
  items,
  canManage = false,
}: {
  items: ContentItem[];
  canManage?: boolean;
}) {
  const t = useText();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();

  const availableTags = Array.from(new Set(items.flatMap((item) => item.tags))).sort((left, right) =>
    left.localeCompare(right)
  );

  const filteredItems = items
    .filter((item) => {
      const matchesQuery = `${item.title} ${item.subtitle} ${item.tags.join(" ")} ${item.country ?? ""}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      const matchesTag = tagFilter === "all" || item.tags.includes(tagFilter);
      return matchesQuery && matchesType && matchesSource && matchesTag;
    })
    .slice()
    .sort((left, right) => {
      if (sortBy === "title") {
        return left.title.localeCompare(right.title);
      }

      if (sortBy === "type") {
        return left.type.localeCompare(right.type) || left.title.localeCompare(right.title);
      }

      if (sortBy === "difficulty") {
        return compareDifficulty(left.difficulty, right.difficulty) || left.title.localeCompare(right.title);
      }

      return compareRanking(left, right) || left.title.localeCompare(right.title);
    });

  const visibleIds = filteredItems.map((item) => item.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((itemId) => selectedIds.includes(itemId));
  const deleteItems = async (ids: string[]) => {
    setPendingDelete(true);
    setMessage("");
    try {
      const countToDelete = ids.length;
      await jsonFetch<{ count: number; ids: string[] }>("/api/content/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSelectedIds((current) => current.filter((itemId) => !ids.includes(itemId)));
      setMessage(
        t(
          `Deleted ${countToDelete} content items.`,
          `已删除 ${countToDelete} 条内容。`
        )
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : t("Delete failed.", "删除失败。")
      );
    } finally {
      setPendingDelete(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl bg-surface-container-low px-4 py-3"
          placeholder={t("Filter content, majors, or schools...", "筛选内容、专业或学校...")}
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="all">{t("All types", "全部类型")}</option>
          <option value="course">{t("Course", "课程")}</option>
          <option value="chapter">{t("Chapter", "章节")}</option>
          <option value="competition">{t("Competition", "竞赛")}</option>
          <option value="school">{t("School", "学校")}</option>
          <option value="major">{t("Major", "专业")}</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="all">{t("All sources", "全部来源")}</option>
          <option value="manual">{t("Manual", "手动录入")}</option>
          <option value="import">{t("Import", "导入")}</option>
        </select>
        <select
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="all">{t("All tags", "全部标签")}</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-2xl bg-surface-container-low px-4 py-3"
        >
          <option value="title">{t("Sort: title", "排序：标题")}</option>
          <option value="type">{t("Sort: type", "排序：类型")}</option>
          <option value="difficulty">{t("Sort: difficulty", "排序：难度")}</option>
          <option value="ranking">{t("Sort: ranking", "排序：学校排名")}</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {canManage ? (
          <>
            <button
              type="button"
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-secondary"
              onClick={() =>
                setSelectedIds((current) =>
                  allVisibleSelected
                    ? current.filter((itemId) => !visibleIds.includes(itemId))
                    : Array.from(new Set([...current, ...visibleIds]))
                )
              }
            >
              {allVisibleSelected
                ? t("Clear visible selection", "取消当前筛选结果选择")
                : t("Select visible rows", "选中当前筛选结果")}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || pendingDelete}
              className="rounded-full bg-error px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              onClick={() => void deleteItems(selectedIds)}
            >
              {pendingDelete
                ? t("Deleting...", "删除中...")
                : t("Delete selected", "删除选中项")}
            </button>
          </>
        ) : null}
        <p className="text-sm font-semibold text-secondary">
          {canManage
            ? t(
                `${filteredItems.length} items shown · ${selectedIds.length} selected`,
                `当前显示 ${filteredItems.length} 条 · 已选中 ${selectedIds.length} 条`
              )
            : t(`${filteredItems.length} items shown`, `当前显示 ${filteredItems.length} 条`)}
        </p>
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
      </div>
      <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-surface-container-low text-secondary">
            <tr>
              {canManage ? (
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() =>
                      setSelectedIds((current) =>
                        allVisibleSelected
                          ? current.filter((itemId) => !visibleIds.includes(itemId))
                          : Array.from(new Set([...current, ...visibleIds]))
                      )
                    }
                    aria-label={t("Select visible rows", "选中当前筛选结果")}
                  />
                </th>
              ) : null}
              <th className="px-4 py-3">{t("Title", "标题")}</th>
              <th className="px-4 py-3">{t("Type", "类型")}</th>
              <th className="px-4 py-3">{t("Details", "详情字段")}</th>
              <th className="px-4 py-3">{t("Difficulty", "难度")}</th>
              <th className="px-4 py-3">{t("Source", "来源")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-t border-black/5">
                {canManage ? (
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((itemId) => itemId !== item.id)
                        )
                      }
                      aria-label={t("Select row", "选中行")}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-secondary">{item.subtitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-secondary">{item.type}</td>
                <td className="px-4 py-3 text-secondary">{renderContentDetailsSummary(item, t)}</td>
                <td className="px-4 py-3">{item.difficulty}</td>
                <td className="px-4 py-3 capitalize text-secondary">{item.source}</td>
              </tr>
            ))}
            {filteredItems.length === 0 ? (
              <tr className="border-t border-black/5">
                <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-sm font-medium text-secondary">
                  {t("No content matches the current filters.", "当前筛选条件下没有内容。")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function splitCommaValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compareDifficulty(left: ContentItem["difficulty"], right: ContentItem["difficulty"]) {
  const order = { Safety: 0, Match: 1, Reach: 2 };
  return order[left] - order[right];
}

function compareRanking(left: ContentItem, right: ContentItem) {
  const leftValue = extractRankingNumber(left.schoolDetails?.ranking);
  const rightValue = extractRankingNumber(right.schoolDetails?.ranking);
  return leftValue - rightValue;
}

function extractRankingNumber(value?: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const match = value.match(/\d+(\.\d+)?/);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function splitRankingDisplay(value?: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

  if (!match) {
    return {
      number: null,
      source: trimmed,
      raw: trimmed,
    };
  }

  return {
    number: match[1],
    source: match[2]?.trim() || null,
    raw: trimmed,
  };
}

function renderSchoolRanking(value: string | undefined, t: ReturnType<typeof useText>) {
  const ranking = splitRankingDisplay(value);

  if (!ranking) {
    return "—";
  }

  if (!ranking.number) {
    return (
      <span className="inline-flex rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-secondary">
        {ranking.raw}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex min-w-12 items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        {t(`#${ranking.number}`, `#${ranking.number}`)}
      </span>
      {ranking.source ? (
        <span className="inline-flex rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-secondary">
          {ranking.source}
        </span>
      ) : null}
    </div>
  );
}

function renderSchoolInfoChip(
  value: string | null | undefined,
  tone: "neutral" | "primary" | "success"
) {
  if (!value) {
    return "—";
  }

  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-surface-container-low text-secondary";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
    >
      {value}
    </span>
  );
}

function formatSchoolTuition(value?: number) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `$${value.toLocaleString()}/yr`;
}

function formatAcceptanceRate(value?: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    return trimmed;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }

  if (parsed <= 1) {
    return `${(parsed * 100).toFixed(1).replace(/\.0$/, "")}%`;
  }

  return `${parsed.toFixed(1).replace(/\.0$/, "")}%`;
}

function renderContentDetailsSummary(item: ContentItem, t: ReturnType<typeof useText>) {
  const chips: string[] = [];

  if (item.type === "school") {
    if (item.schoolDetails?.ranking) {
      const ranking = splitRankingDisplay(item.schoolDetails.ranking);
      if (ranking?.number && ranking.source) {
        chips.push(
          t(`Rank #${ranking.number} · ${ranking.source}`, `排名 #${ranking.number} · ${ranking.source}`)
        );
      } else if (ranking?.number) {
        chips.push(t(`Rank #${ranking.number}`, `排名 #${ranking.number}`));
      } else if (ranking?.raw) {
        chips.push(t(`Rank ${ranking.raw}`, `排名 ${ranking.raw}`));
      }
    }
    if (item.schoolDetails?.city) chips.push(item.schoolDetails.city);
    if (item.schoolDetails?.tuitionUsd != null) chips.push(`$${item.schoolDetails.tuitionUsd.toLocaleString()}/yr`);
    if (item.schoolDetails?.acceptanceRate) {
      const formattedRate = formatAcceptanceRate(item.schoolDetails.acceptanceRate);
      if (formattedRate) chips.push(formattedRate);
    }
  }

  if (item.type === "major") {
    if (item.majorDetails?.degree) chips.push(item.majorDetails.degree);
    if (item.majorDetails?.stemEligible) chips.push("STEM");
    if (item.majorDetails?.careerPaths?.length) chips.push(item.majorDetails.careerPaths[0] as string);
    if (item.majorDetails?.recommendedBackground) chips.push(item.majorDetails.recommendedBackground);
  }

  if (item.type === "competition") {
    if (item.competitionDetails?.organizer) chips.push(item.competitionDetails.organizer);
    if (item.competitionDetails?.eligibility) chips.push(item.competitionDetails.eligibility);
    if (item.competitionDetails?.award) chips.push(item.competitionDetails.award);
    if (item.competitionDetails?.season) chips.push(item.competitionDetails.season);
  }

  if (item.type === "course") {
    if (item.courseDetails?.provider) chips.push(item.courseDetails.provider);
    if (item.courseDetails?.format) chips.push(item.courseDetails.format);
    if (item.courseDetails?.durationWeeks != null) chips.push(t(`${item.courseDetails.durationWeeks} weeks`, `${item.courseDetails.durationWeeks} 周`));
    if (item.courseDetails?.workload) chips.push(item.courseDetails.workload);
  }

  if (item.type === "chapter") {
    if (item.chapterDetails?.curriculum) chips.push(item.chapterDetails.curriculum);
    if (item.chapterDetails?.sequence) chips.push(item.chapterDetails.sequence);
    if (item.chapterDetails?.estimatedHours != null) chips.push(t(`${item.chapterDetails.estimatedHours} hours`, `${item.chapterDetails.estimatedHours} 小时`));
    if (item.chapterDetails?.keySkill) chips.push(item.chapterDetails.keySkill);
  }

  return chips.length ? chips.join(" · ") : "—";
}
