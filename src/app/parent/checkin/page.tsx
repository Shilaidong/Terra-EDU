import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpenText, BrainCircuit, FileCheck2 } from "lucide-react";

import { LogoutButton } from "@/components/client-tools";
import { ReadonlyStudyCenterWorkspace } from "@/components/study-center";
import { HeroBadge, RoleShell, SectionCard } from "@/components/terra-shell";
import {
  getParentOverviewData,
  getStudentHomeworkTodayQuestion,
  getStudentStudyCenterData,
  getStudentStudyCenterMetrics,
  getStudentVocabularyReviewQueue,
} from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ParentCheckinPage({
  searchParams,
}: {
  searchParams?: Promise<{ studentId?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession("parent");
  const params = (await searchParams) ?? {};
  const overview = await getParentOverviewData(session, params.studentId);
  const { student, linkedStudents } = overview;

  if (!student) {
    return (
      <RoleShell
        session={session}
        title={pickText(locale, "Learning Center", "学习中心")}
        subtitle={pickText(
          locale,
          "This parent account is waiting for an admin to bind a student before the learning center becomes available.",
          "这个家长账号还在等待管理员绑定学生，绑定后才会显示学习中心。"
        )}
        activeHref="/parent/checkin"
        hero={<LogoutButton />}
      >
        <SectionCard title={pickText(locale, "Binding pending", "等待绑定")} eyebrow={pickText(locale, "Admin action needed", "需要管理员操作")}>
          <p className="text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
            {pickText(
              locale,
              "After the admin links this parent account to a student, you will see vocabulary review, AI grading history, and reading training here.",
              "管理员把这个家长账号绑定到学生后，这里就会显示单词背诵、AI 出题批改和应试阅读记录。"
            )}
          </p>
        </SectionCard>
      </RoleShell>
    );
  }

  const [studyCenter, studyCenterMetrics, reviewQueue, homeworkToday] = await Promise.all([
    getStudentStudyCenterData(student.id),
    getStudentStudyCenterMetrics(student.id),
    getStudentVocabularyReviewQueue(student.id),
    getStudentHomeworkTodayQuestion(student.id),
  ]);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Learning Center", "学习中心")}
      subtitle={pickText(
        locale,
        "See your student's vocabulary rhythm, homework feedback, and reading training in one family-facing view.",
        "在一个家长视图里，清楚查看孩子的单词节奏、作业批改结果和阅读训练。"
      )}
      activeHref="/parent/checkin"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {linkedStudents.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-surface-container-low px-2 py-2 sm:px-3">
              {linkedStudents.map((linkedStudent) => {
                const active = linkedStudent.id === student.id;
                return (
                  <Link
                    key={linkedStudent.id}
                    href={`/parent/checkin?studentId=${linkedStudent.id}`}
                    className={
                      active
                        ? "rounded-full border-2 border-primary bg-primary/5 px-3 py-2 text-xs font-bold text-primary"
                        : "rounded-full border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-secondary"
                    }
                  >
                    {linkedStudent.name}
                  </Link>
                );
              })}
            </div>
          ) : null}
          <HeroBadge icon={<BookOpenText className="h-4 w-4" />} title={pickText(locale, "Student", "当前学生")} value={student.name} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <HeroStat
          icon={<BookOpenText className="h-4 w-4" />}
          title={pickText(locale, "Vocabulary", "单词背诵")}
          body={pickText(locale, "See whether review packs are being revisited on rhythm.", "查看词包复习是否按节奏持续进行。")}
        />
        <HeroStat
          icon={<FileCheck2 className="h-4 w-4" />}
          title={pickText(locale, "AI Question Practice", "AI 出题批改")}
          body={pickText(locale, "Read the latest daily question results without changing the student's record.", "直接查看最近的每日题目结果，但不改动学生记录。")}
        />
        <HeroStat
          icon={<BrainCircuit className="h-4 w-4" />}
          title={pickText(locale, "Exam Reading", "应试阅读")}
          body={pickText(locale, "Follow daily reading consistency and self-rated comprehension.", "关注阅读训练的日常连续性和理解自评。")}
        />
      </div>

      <div className="mt-8">
        <SectionCard title={pickText(locale, "Read-only family view", "家长只读视图")} eyebrow={pickText(locale, "Learning history", "学习记录")}>
          <ReadonlyStudyCenterWorkspace
            metrics={studyCenterMetrics}
            studyCenter={studyCenter}
            reviewQueue={reviewQueue}
            homeworkToday={homeworkToday}
          />
        </SectionCard>
      </div>
    </RoleShell>
  );
}

function HeroStat({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-5 sm:p-6">
      <div className="inline-flex rounded-full bg-white px-3 py-2 text-primary shadow-sm">{icon}</div>
      <p className="mt-4 font-serif text-xl font-bold text-foreground sm:text-2xl">{title}</p>
      <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{body}</p>
    </div>
  );
}
