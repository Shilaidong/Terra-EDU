import type { ReactNode } from "react";
import { Activity, BookOpenText, BrainCircuit, FileCheck2 } from "lucide-react";

import { LogoutButton } from "@/components/client-tools";
import { StudentStudyCenterWorkspace } from "@/components/study-center";
import { HeroBadge, RoleShell, SectionCard } from "@/components/terra-shell";
import {
  getCurrentStudentData,
  getStudentHomeworkTodayQuestion,
  getStudentLiveMetricsData,
  getStudentStudyCenterData,
  getStudentStudyCenterMetrics,
  getStudentVocabularyReviewQueue,
} from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function StudentCheckinPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const [studyCenter, studyCenterMetrics, metrics, reviewQueue, homeworkToday] = await Promise.all([
    getStudentStudyCenterData(student.id),
    getStudentStudyCenterMetrics(student.id),
    getStudentLiveMetricsData(student.id),
    getStudentVocabularyReviewQueue(student.id),
    getStudentHomeworkTodayQuestion(student.id),
  ]);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Study Center", "学习中心")}
      subtitle={pickText(
        locale,
        "Keep vocabulary review, AI homework grading, and exam reading in one calm place so your daily learning evidence keeps building over time.",
        "把单词复习、AI 出题批改和应试阅读集中在一个安静的学习中心里，让你的日常训练记录持续积累。"
      )}
      activeHref="/student/checkin"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge
            icon={<Activity className="h-4 w-4" />}
            title={pickText(locale, "Study streak", "连续学习")}
            value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)}
          />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <HeroStat
          icon={<BookOpenText className="h-4 w-4" />}
          title={pickText(locale, "Vocabulary", "单词背诵")}
          body={pickText(
            locale,
            "Follow a simple Ebbinghaus-style rhythm, keep the packs small, and let steady repetition do the real work.",
            "按艾宾浩斯节奏做词包复习，保持小批量、持续性，让复习真正形成长期积累。"
          )}
        />
        <HeroStat
          icon={<FileCheck2 className="h-4 w-4" />}
          title={pickText(locale, "AI Question Grading", "AI 出题批改")}
          body={pickText(
            locale,
            "Import your own question bank. The system serves one non-repeated question each day and grades your answer automatically.",
            "导入你自己的题库后，系统会每天抽一道未完成的题，并自动判断你的作答是否正确。"
          )}
        />
        <HeroStat
          icon={<BrainCircuit className="h-4 w-4" />}
          title={pickText(locale, "Exam Reading", "应试阅读")}
          body={pickText(
            locale,
            "Log short daily reading sessions so language input, speed, and comprehension all move forward together.",
            "把每日阅读训练稳定记录下来，让语言输入、速度和理解力一起稳步向前。"
          )}
        />
      </div>

      <div className="mt-8">
        <SectionCard
          title={pickText(locale, "Three modules, one learning rhythm", "三个模块，一套学习节奏")}
          eyebrow={pickText(locale, "Daily evidence", "日常证据")}
        >
          <StudentStudyCenterWorkspace
            studentId={student.id}
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
