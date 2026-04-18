import { Activity } from "lucide-react";

import { CheckInComposer, CheckInEditorControls, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getCurrentStudentData, getStudentCheckInsData, getStudentLiveMetricsData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function StudentCheckinPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const [checkIns, metrics] = await Promise.all([
    getStudentCheckInsData(student.id),
    getStudentLiveMetricsData(student.id),
  ]);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Daily Task Check-in", "每日学习打卡")}
      subtitle={pickText(locale, "Capture curriculum mastery, chapter notes, and learning momentum without changing the core visual style.", "记录课程掌握度、章节笔记和学习节奏，同时保持现有视觉风格。")}
      activeHref="/student/checkin"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<Activity className="h-4 w-4" />} title={pickText(locale, "Streak", "连续打卡")} value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Average mastery", "平均掌握度")} value={`${metrics.masteryAverage}/5`} hint={pickText(locale, "Calculated from all saved check-ins.", "根据全部已保存打卡实时计算。")} />
        <StatCard label={pickText(locale, "Recent entries", "最近记录")} value={`${checkIns.length}`} hint={pickText(locale, "Saved check-ins will keep building your learning picture.", "每一次打卡都会继续补完整体学习画像。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Launch focus", "当前重点")} value={pickText(locale, "Steady rhythm", "稳定节奏")} hint={pickText(locale, "Keep the rhythm consistent and your next recommendation will stay much clearer.", "只要持续保持稳定节奏，后面的建议也会更清晰。")} tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title={pickText(locale, "Save today's mastery", "保存今日掌握度")} eyebrow={pickText(locale, "Writable", "可编辑")}>
          <CheckInComposer studentId={student.id} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Recent study signals", "近期学习信号")} eyebrow={pickText(locale, "History", "历史记录")}>
          <div className="space-y-4">
            {checkIns.map((record) => (
              <div key={record.id} className="rounded-2xl bg-surface-container-low p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">
                      {record.curriculum} · {record.chapter}
                    </p>
                    <p className="mt-1 text-sm text-secondary">{record.notes}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    {record.mastery}/5
                  </div>
                </div>
                <CheckInEditorControls
                  checkIn={{
                    id: record.id,
                    curriculum: record.curriculum,
                    chapter: record.chapter,
                    mastery: record.mastery,
                    date: record.date,
                    notes: record.notes,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Notice title={pickText(locale, "Why this matters", "为什么这很重要")}>
              {pickText(locale, "These notes flow into the AI summary and consultant analytics so the next recommendation is evidence-based, not guessed.", "这些笔记会进入 AI 摘要和顾问分析，让后续建议基于真实证据，而不是主观猜测。")}
            </Notice>
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
