"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BookOpenText, BrainCircuit, FileQuestion, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { useText } from "@/components/locale-provider";
import type {
  HomeworkQuestionItem,
  HomeworkQuestionAttempt,
  ReadingPassageItem,
  ReadingQuizAttempt,
  ReadingQuizQuestion,
  StudyCenterData,
  StudyCenterMetrics,
  VocabularyAttempt,
  VocabularyPack,
  VocabularyWordItem,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type StudyCenterTab = "vocabulary" | "grading" | "reading";

type ReviewQueueItem = {
  packName: string;
  nextDueDate: string;
  stageLabel: string;
  latestRecord: {
    id: string;
    packName: string;
    reviewWordsCount: number;
  };
};

type HomeworkTodayData = {
  question: HomeworkQuestionItem | null;
  currentSubject: string | null;
  subjectProgress: Array<{ subject: string; total: number; completed: number; latestDate: string }>;
};

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { success?: boolean; message?: string; data?: T }) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload.data as T;
}

const tabs = [
  { id: "vocabulary", icon: BookOpenText },
  { id: "grading", icon: FileQuestion },
  { id: "reading", icon: BrainCircuit },
] satisfies { id: StudyCenterTab; icon: typeof BookOpenText }[];

export function StudentStudyCenterWorkspace({
  studentId,
  metrics,
  studyCenter,
  reviewQueue,
  homeworkToday,
}: {
  studentId: string;
  metrics: StudyCenterMetrics;
  studyCenter: StudyCenterData;
  reviewQueue: ReviewQueueItem[];
  homeworkToday: HomeworkTodayData;
}) {
  const t = useText();
  const [activeTab, setActiveTab] = useState<StudyCenterTab>("vocabulary");

  return (
    <div className="space-y-6">
      <StudyCenterSummary metrics={metrics} />
      <StudyCenterTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="rounded-3xl border border-primary/10 bg-surface-container-low px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold text-foreground sm:text-[15px]">
          {t(
            "Each module starts by importing your own material. Upload a template first, then the system turns it into daily practice.",
            "这三个模块都先从导入你自己的内容开始。先上传模板，系统再把它变成每天可执行的练习。"
          )}
        </p>
      </div>

      {activeTab === "vocabulary" ? (
        <VocabularyStudentPanel
          studentId={studentId}
          metrics={metrics}
          reviewQueue={reviewQueue}
          packs={studyCenter.vocabularyPacks}
          words={studyCenter.vocabularyWords}
          attempts={studyCenter.vocabularyAttempts}
        />
      ) : null}

      {activeTab === "grading" ? (
        <HomeworkStudentPanel
          studentId={studentId}
          questions={studyCenter.homeworkQuestions}
          attempts={studyCenter.homeworkAttempts}
          todayData={homeworkToday}
        />
      ) : null}

      {activeTab === "reading" ? (
        <ReadingStudentPanel
          studentId={studentId}
          passages={studyCenter.readingPassages}
          attempts={studyCenter.readingQuizAttempts}
        />
      ) : null}
    </div>
  );
}

export function ReadonlyStudyCenterWorkspace({
  metrics,
  studyCenter,
  reviewQueue,
  homeworkToday,
}: {
  metrics: StudyCenterMetrics;
  studyCenter: StudyCenterData;
  reviewQueue: ReviewQueueItem[];
  homeworkToday: HomeworkTodayData;
}) {
  const [activeTab, setActiveTab] = useState<StudyCenterTab>("vocabulary");

  return (
    <div className="space-y-6">
      <StudyCenterSummary metrics={metrics} />
      <StudyCenterTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "vocabulary" ? (
        <VocabularyReadonlyPanel packs={studyCenter.vocabularyPacks} words={studyCenter.vocabularyWords} attempts={studyCenter.vocabularyAttempts} reviewQueue={reviewQueue} />
      ) : null}

      {activeTab === "grading" ? (
        <HomeworkReadonlyPanel questions={studyCenter.homeworkQuestions} attempts={studyCenter.homeworkAttempts} todayData={homeworkToday} />
      ) : null}

      {activeTab === "reading" ? (
        <ReadingReadonlyPanel passages={studyCenter.readingPassages} attempts={studyCenter.readingQuizAttempts} />
      ) : null}
    </div>
  );
}

function StudyCenterSummary({ metrics }: { metrics: StudyCenterMetrics }) {
  const t = useText();
  const cards = [
    { label: t("Study streak", "连续学习"), value: t(`${metrics.streakDays} days`, `${metrics.streakDays} 天`) },
    { label: t("Recent 7-day sessions", "近 7 天训练"), value: `${metrics.recentSessionCount}` },
    { label: t("Vocabulary accuracy", "单词正确率"), value: `${metrics.vocabularyReviewCompletionRate}%` },
    { label: t("Reading attempts", "阅读训练次数"), value: `${metrics.readingSessionCount}` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-black/5 bg-surface-container-low p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-xs">{card.label}</p>
          <p className="mt-3 font-serif text-2xl font-bold text-foreground sm:text-[2rem]">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function StudyCenterTabs({
  activeTab,
  onChange,
}: {
  activeTab: StudyCenterTab;
  onChange: (tab: StudyCenterTab) => void;
}) {
  const t = useText();

  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-black/5 bg-surface-container-low p-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-colors sm:px-5 sm:text-sm",
              activeTab === tab.id
                ? "border border-primary/20 bg-primary text-white shadow-sm"
                : "bg-white text-secondary hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.id === "vocabulary"
              ? t("Vocabulary", "单词背诵")
              : tab.id === "grading"
                ? t("AI Q&A Grading", "AI 出题批改")
                : t("Reading", "应试阅读")}
          </button>
        );
      })}
    </div>
  );
}

function VocabularyStudentPanel({
  studentId,
  packs,
  words,
  attempts,
  reviewQueue,
}: {
  studentId: string;
  metrics: StudyCenterMetrics;
  packs: VocabularyPack[];
  words: VocabularyWordItem[];
  attempts: VocabularyAttempt[];
  reviewQueue: ReviewQueueItem[];
}) {
  const t = useText();
  const router = useRouter();
  const activePack = packs.find((pack) => pack.active) ?? packs[0] ?? null;
  const [packName, setPackName] = useState(activePack?.name ?? "托福核心词汇 A1");
  const [dailyNewCount, setDailyNewCount] = useState(activePack?.dailyNewCount ?? 12);
  const [dailyReviewCount, setDailyReviewCount] = useState(activePack?.dailyReviewCount ?? 24);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPackId, setSelectedPackId] = useState(activePack?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const practiceWords = useMemo(() => {
    if (!selectedPackId) return [];
    const selectedPack = packs.find((pack) => pack.id === selectedPackId);
    if (!selectedPack) return [];
    const packWords = words.filter((word) => word.packId === selectedPack.id && !word.completed);
    const today = new Date().toISOString().slice(0, 10);
    const dueWords = packWords.filter((word) => word.nextReviewOn && word.nextReviewOn <= today).slice(0, selectedPack.dailyReviewCount);
    const newWords = packWords.filter((word) => !word.introducedOn).slice(0, selectedPack.dailyNewCount);
    const merged = [...dueWords, ...newWords.filter((word) => !dueWords.some((due) => due.id === word.id))];
    return merged.slice(0, selectedPack.dailyReviewCount + selectedPack.dailyNewCount);
  }, [packs, selectedPackId, words]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <ImportCard
          title={t("Import your vocabulary pack", "导入你的单词词包")}
          description={t(
            "Download the template, fill your words and meanings, then set how many new and review words you want each day.",
            "先下载模板，填好单词和中文释义，再设定你每天要背多少新词、复习多少旧词。"
          )}
          templateHref="/templates/study-center-vocabulary-template.csv"
          templateLabel={t("Download vocabulary template", "下载单词模板")}
        >
          <FieldGroup label={t("Pack name", "词包名称")}>
            <InputField value={packName} onChange={setPackName} placeholder={t("Pack name", "词包名称")} />
          </FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label={t("Daily new words", "每日新词量")}>
              <InputField value={String(dailyNewCount)} onChange={(value) => setDailyNewCount(Number(value) || 0)} type="number" />
            </FieldGroup>
            <FieldGroup label={t("Daily review words", "每日复习量")}>
              <InputField value={String(dailyReviewCount)} onChange={(value) => setDailyReviewCount(Number(value) || 0)} type="number" />
            </FieldGroup>
          </div>
          <FieldGroup label={t("Upload template file", "上传模板文件")}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
            />
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!file || importing}
              onClick={async () => {
                setImporting(true);
                setMessage("");
                try {
                  const formData = new FormData();
                  formData.set("studentId", studentId);
                  formData.set("packName", packName);
                  formData.set("dailyNewCount", String(dailyNewCount));
                  formData.set("dailyReviewCount", String(dailyReviewCount));
                  if (file) formData.set("file", file);
                  const result = await jsonFetch<{ pack: VocabularyPack }>("/api/student/study-center/vocabulary/import", {
                    method: "POST",
                    body: formData,
                  });
                  setSelectedPackId(result.pack.id);
                  setMessage(t("Vocabulary pack imported. You can start today's practice now.", "词包导入成功，现在就可以开始今天的练习了。"));
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("Import failed.", "导入失败。"));
                } finally {
                  setImporting(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              {importing ? t("Importing...", "导入中...") : t("Import vocabulary pack", "导入单词词包")}
            </button>
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>
        </ImportCard>

        <SectionCardLike title={t("Current packs", "当前词包")}>
          <div className="space-y-3">
            {packs.length > 0 ? (
              packs.map((pack) => {
                const packWords = words.filter((word) => word.packId === pack.id);
                const introducedCount = packWords.filter((word) => word.introducedOn).length;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPackId(pack.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left",
                      selectedPackId === pack.id
                        ? "border-primary/30 bg-primary/5"
                        : "border-outline-variant bg-white"
                    )}
                  >
                    <p className="text-sm font-bold text-foreground">{pack.name}</p>
                    <p className="mt-1 text-xs text-secondary sm:text-sm">
                      {t("Total words", "总词数")} {pack.totalWords} · {t("Started", "已开启")} {introducedCount}
                    </p>
                  </button>
                );
              })
            ) : (
              <EmptyHint text={t("No vocabulary pack imported yet.", "你还没有导入单词词包。")} />
            )}
          </div>
        </SectionCardLike>

        <SectionCardLike title={t("Due for review today", "今日应复习")}>
          <div className="space-y-3">
            {reviewQueue.length > 0 ? (
              reviewQueue.map((item) => (
                <div key={`${item.packName}-${item.nextDueDate}`} className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-sm font-bold text-foreground">{item.packName}</p>
                  <p className="mt-1 text-xs text-secondary sm:text-sm">
                    {item.stageLabel} · {item.nextDueDate} · {t("Due words", "待复习")} {item.latestRecord.reviewWordsCount}
                  </p>
                </div>
              ))
            ) : (
              <EmptyHint text={t("No due review words today.", "今天没有到期的复习词。")} />
            )}
          </div>
        </SectionCardLike>
      </div>

      <div className="space-y-6">
        <SectionCardLike title={t("Start today's vocabulary practice", "开始今天的单词练习")}>
          <p className="text-sm leading-7 text-secondary">
            {t(
              "Write the Chinese meaning in the answer box. The system will check correctness, calculate accuracy, and automatically update the next review date.",
              "在答案框里填写中文释义。系统会自动判断正确率，并更新下一次复习日期。"
            )}
          </p>
          <div className="mt-4 space-y-4">
            {practiceWords.length > 0 ? (
              practiceWords.map((word) => (
                <div key={word.id} className="rounded-2xl border border-outline-variant bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    {word.introducedOn ? t("Review", "复习") : t("New word", "新词")}
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">{word.word}</p>
                  {word.notes ? <p className="mt-2 text-xs text-secondary">{word.notes}</p> : null}
                  <input
                    value={answers[word.id] ?? ""}
                    onChange={(event) => setAnswers((current) => ({ ...current, [word.id]: event.target.value }))}
                    placeholder={t("Type the meaning", "输入中文释义")}
                    className="mt-3 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
                  />
                </div>
              ))
            ) : (
              <EmptyHint text={t("Import a pack first, or all due words for today are already finished.", "先导入词包，或者你今天该练的词已经做完了。")} />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!selectedPackId || practiceWords.length === 0 || submitting}
              onClick={async () => {
                setSubmitting(true);
                setMessage("");
                try {
                  const result = await jsonFetch<{ accuracy: number; correctCount: number; totalCount: number }>(
                    "/api/student/study-center/vocabulary/practice",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        studentId,
                        packId: selectedPackId,
                        answers: practiceWords.map((word) => ({
                          wordItemId: word.id,
                          studentAnswer: answers[word.id] ?? "",
                        })),
                      }),
                    }
                  );
                  setAnswers({});
                  setMessage(
                    t(
                      `Practice saved. Accuracy ${result.accuracy}% (${result.correctCount}/${result.totalCount}).`,
                      `练习已保存，正确率 ${result.accuracy}%（${result.correctCount}/${result.totalCount}）。`
                    )
                  );
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("Practice submission failed.", "提交练习失败。"));
                } finally {
                  setSubmitting(false);
                }
              }}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {submitting ? t("Submitting...", "提交中...") : t("Submit today's vocabulary practice", "提交今天的单词练习")}
            </button>
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>
        </SectionCardLike>

        <HistoryColumn
          title={t("Recent vocabulary attempts", "最近单词练习记录")}
          items={attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-bold text-foreground">{attempt.prompt}</p>
              <p className="mt-1 text-xs text-secondary sm:text-sm">
                {attempt.date} · {attempt.mode === "review" ? t("Review", "复习") : t("New", "新词")}
              </p>
              <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
                {t("Your answer", "你的答案")}：{attempt.studentAnswer || t("Empty", "未填写")} · {t("Expected", "标准答案")}：{attempt.expectedAnswer}
              </p>
              <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold", attempt.correct ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>
                {attempt.correct ? t("Correct", "正确") : t("Needs review", "需要继续复习")}
              </span>
            </div>
          ))}
        />
      </div>
    </div>
  );
}

function HomeworkStudentPanel({
  studentId,
  questions,
  attempts,
  todayData,
}: {
  studentId: string;
  questions: HomeworkQuestionItem[];
  attempts: HomeworkQuestionAttempt[];
  todayData: HomeworkTodayData;
}) {
  const t = useText();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <ImportCard
          title={t("Import your homework question bank", "导入你的作业题库")}
          description={t(
            "Upload your own questions and correct answers. The system will serve one non-repeated question per day and grade your answer automatically.",
            "上传你自己的题目和标准答案。系统会每天随机抽一道未完成的题，并自动判断你的作答是否正确。"
          )}
          templateHref="/templates/study-center-homework-template.csv"
          templateLabel={t("Download homework template", "下载作业模板")}
        >
          <FieldGroup label={t("Upload template file", "上传模板文件")}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
            />
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!file || importing}
              onClick={async () => {
                setImporting(true);
                setMessage("");
                try {
                  const formData = new FormData();
                  formData.set("studentId", studentId);
                  if (file) formData.set("file", file);
                  await jsonFetch("/api/student/study-center/grading/import", {
                    method: "POST",
                    body: formData,
                  });
                  setMessage(t("Homework question bank imported.", "作业题库导入成功。"));
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("Import failed.", "导入失败。"));
                } finally {
                  setImporting(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              {importing ? t("Importing...", "导入中...") : t("Import question bank", "导入题库")}
            </button>
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>
        </ImportCard>

        <SectionCardLike title={t("Subject progress", "科目进度")}>
          <div className="space-y-3">
            {todayData.subjectProgress.length > 0 ? (
              todayData.subjectProgress.map((item) => (
                <div key={item.subject} className="rounded-2xl bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-foreground">{item.subject}</p>
                    <span className="text-xs font-semibold text-secondary">
                      {item.completed}/{item.total}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-surface-container-low">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${item.total > 0 ? (item.completed / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyHint text={t("No homework question bank yet.", "你还没有导入作业题库。")} />
            )}
          </div>
        </SectionCardLike>
      </div>

      <div className="space-y-6">
        <SectionCardLike title={t("Today's question", "今日题目")}>
          {todayData.question ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {todayData.currentSubject || t("Current subject", "当前科目")}
              </p>
              <p className="mt-3 text-base font-bold text-foreground sm:text-lg">{todayData.question.prompt}</p>
              <FieldGroup label={t("Your answer", "你的答案")} className="mt-4">
                <TextareaField value={answer} onChange={setAnswer} placeholder={t("Write your answer here", "在这里写下你的答案")} minHeight="min-h-36" />
              </FieldGroup>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!answer.trim() || submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    setMessage("");
                    try {
                      const result = await jsonFetch<{ attempt: HomeworkQuestionAttempt; question: HomeworkQuestionItem }>(
                        "/api/student/study-center/grading/answer",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            studentId,
                            questionId: todayData.question?.id,
                            studentAnswer: answer,
                          }),
                        }
                      );
                      setAnswer("");
                      setMessage(
                        result.attempt.correct
                          ? t("Correct. The system has marked this question as completed.", "回答正确，系统已把这道题标记为完成。")
                          : t("Not quite yet. This question will stay in your pool for future practice.", "这次还不够准确，这道题会继续留在你的题库里等待后续练习。")
                      );
                      router.refresh();
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : t("Submission failed.", "提交失败。"));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
                >
                  {submitting ? t("Submitting...", "提交中...") : t("Submit today's answer", "提交今日答案")}
                </button>
                {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
              </div>
            </>
          ) : (
            <EmptyHint text={t("No available question for today. Import a bank first or you may have completed every subject.", "今天没有可出的题目。可能是你还没导入题库，或者当前科目的题已经都完成了。")} />
          )}
        </SectionCardLike>

        <HistoryColumn
          title={t("Recent grading attempts", "最近判题记录")}
          items={attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground">{attempt.subject}</p>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", attempt.correct ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>
                  {attempt.correct ? t("Correct", "正确") : t("Incorrect", "错误")}
                </span>
              </div>
              <p className="mt-1 text-xs text-secondary sm:text-sm">{attempt.date}</p>
              <p className="mt-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
                {t("Your answer", "你的答案")}：{attempt.studentAnswer}
              </p>
            </div>
          ))}
        />
      </div>
    </div>
  );
}

function ReadingStudentPanel({
  studentId,
  passages,
  attempts,
}: {
  studentId: string;
  passages: ReadingPassageItem[];
  attempts: ReadingQuizAttempt[];
}) {
  const t = useText();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPassageId, setSelectedPassageId] = useState(passages[0]?.id ?? "");
  const [quiz, setQuiz] = useState<{ passage: ReadingPassageItem; questions: ReadingQuizQuestion[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <ImportCard
          title={t("Import your reading bank", "导入你的阅读材料库")}
          description={t(
            "Upload your own reading passages. After that, you can let AI generate five multiple-choice questions for one passage at a time.",
            "上传你自己的阅读文章。之后就可以让 AI 针对其中一篇生成 5 道选择题。"
          )}
          templateHref="/templates/study-center-reading-template.csv"
          templateLabel={t("Download reading template", "下载阅读模板")}
        >
          <FieldGroup label={t("Upload template file", "上传模板文件")}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
            />
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!file || importing}
              onClick={async () => {
                setImporting(true);
                setMessage("");
                try {
                  const formData = new FormData();
                  formData.set("studentId", studentId);
                  if (file) formData.set("file", file);
                  await jsonFetch("/api/student/study-center/reading/import", {
                    method: "POST",
                    body: formData,
                  });
                  setMessage(t("Reading bank imported.", "阅读材料导入成功。"));
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("Import failed.", "导入失败。"));
                } finally {
                  setImporting(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              {importing ? t("Importing...", "导入中...") : t("Import reading bank", "导入阅读材料")}
            </button>
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>
        </ImportCard>

        <SectionCardLike title={t("Available passages", "可用阅读文章")}>
          <div className="space-y-3">
            {passages.length > 0 ? (
              passages.map((passage) => (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => setSelectedPassageId(passage.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left",
                    selectedPassageId === passage.id ? "border-primary/30 bg-primary/5" : "border-outline-variant bg-white"
                  )}
                >
                  <p className="text-sm font-bold text-foreground">{passage.title}</p>
                  <p className="mt-1 text-xs text-secondary sm:text-sm line-clamp-3">{passage.passage}</p>
                </button>
              ))
            ) : (
              <EmptyHint text={t("No reading passages imported yet.", "你还没有导入阅读文章。")} />
            )}
          </div>
        </SectionCardLike>
      </div>

      <div className="space-y-6">
        <SectionCardLike title={t("Generate and answer reading quiz", "生成并完成阅读题")}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!selectedPassageId || generating}
              onClick={async () => {
                setGenerating(true);
                setMessage("");
                try {
                  const result = await jsonFetch<{ passage: ReadingPassageItem; questions: ReadingQuizQuestion[] }>(
                    "/api/student/study-center/reading/generate",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ studentId, passageId: selectedPassageId }),
                    }
                  );
                  setQuiz(result);
                  setSelectedAnswers(Array(result.questions.length).fill(-1));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : t("Quiz generation failed.", "生成阅读题失败。"));
                } finally {
                  setGenerating(false);
                }
              }}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {generating ? t("Generating...", "生成中...") : t("Generate 5 questions", "生成 5 道题")}
            </button>
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>

          {quiz ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm font-bold text-foreground">{quiz.passage.title}</p>
                <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7 line-clamp-6">{quiz.passage.passage}</p>
              </div>
              {quiz.questions.map((question, index) => (
                <div key={`${quiz.passage.id}-${index}`} className="rounded-2xl border border-outline-variant bg-white p-4">
                  <p className="text-sm font-bold text-foreground">{index + 1}. {question.stem}</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-3 py-3 text-sm text-foreground">
                        <input
                          type="radio"
                          name={`reading-${index}`}
                          checked={selectedAnswers[index] === optionIndex}
                          onChange={() => {
                            const next = [...selectedAnswers];
                            next[index] = optionIndex;
                            setSelectedAnswers(next);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                disabled={selectedAnswers.some((item) => item < 0) || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setMessage("");
                  try {
                    const result = await jsonFetch<ReadingQuizAttempt>("/api/student/study-center/reading/submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        studentId,
                        passageId: quiz.passage.id,
                        questions: quiz.questions,
                        selectedAnswers,
                      }),
                    });
                    setMessage(
                      result.perfect
                        ? t("Great job. You answered all five correctly.", "很好，这 5 道题你全部答对了。")
                        : t(
                            `You answered ${result.correctCount} out of ${result.totalQuestions} correctly. Keep this passage for another round.`,
                            `本次答对 ${result.correctCount}/${result.totalQuestions} 题，可以继续围绕这篇文章再练一轮。`
                          )
                    );
                    setQuiz(null);
                    setSelectedAnswers([]);
                    router.refresh();
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : t("Submission failed.", "提交失败。"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
              >
                {submitting ? t("Submitting...", "提交中...") : t("Submit reading answers", "提交阅读答案")}
              </button>
            </div>
          ) : null}
        </SectionCardLike>

        <HistoryColumn
          title={t("Recent reading quiz results", "最近阅读结果")}
          items={attempts.map((attempt) => (
            <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground">{attempt.title}</p>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", attempt.perfect ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>
                  {attempt.correctCount}/{attempt.totalQuestions}
                </span>
              </div>
              <p className="mt-1 text-xs text-secondary sm:text-sm">{attempt.date}</p>
            </div>
          ))}
        />
      </div>
    </div>
  );
}

function VocabularyReadonlyPanel({
  packs,
  words,
  attempts,
  reviewQueue,
}: {
  packs: VocabularyPack[];
  words: VocabularyWordItem[];
  attempts: VocabularyAttempt[];
  reviewQueue: ReviewQueueItem[];
}) {
  const t = useText();
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCardLike title={t("Vocabulary packs", "词包概览")}>
        <div className="space-y-3">
          {packs.length > 0 ? (
            packs.map((pack) => {
              const packWords = words.filter((word) => word.packId === pack.id);
              const accuracy = packWords.reduce((sum, word) => sum + (word.totalAttempts > 0 ? word.correctAttempts / word.totalAttempts : 0), 0);
              return (
                <div key={pack.id} className="rounded-2xl bg-white px-4 py-4">
                  <p className="text-sm font-bold text-foreground">{pack.name}</p>
                  <p className="mt-1 text-xs text-secondary sm:text-sm">
                    {t("Words", "词数")} {pack.totalWords} · {t("Daily plan", "每日计划")} {pack.dailyNewCount}/{pack.dailyReviewCount}
                  </p>
                  <p className="mt-2 text-xs text-secondary sm:text-sm">
                    {t("Approx. accuracy", "大致正确率")} {packWords.length > 0 ? Math.round((accuracy / packWords.length) * 100) : 0}%
                  </p>
                </div>
              );
            })
          ) : (
            <EmptyHint text={t("No vocabulary pack imported yet.", "还没有导入词包。")} />
          )}
        </div>
        <div className="mt-5 space-y-3">
          {reviewQueue.map((item) => (
            <div key={`${item.packName}-${item.nextDueDate}`} className="rounded-2xl bg-surface-container p-4">
              <p className="text-sm font-bold text-foreground">{item.packName}</p>
              <p className="mt-1 text-xs text-secondary sm:text-sm">
                {item.stageLabel} · {item.nextDueDate}
              </p>
            </div>
          ))}
        </div>
      </SectionCardLike>
      <HistoryColumn
        title={t("Recent vocabulary attempts", "最近单词练习记录")}
        items={attempts.map((attempt) => (
          <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-bold text-foreground">{attempt.prompt}</p>
            <p className="mt-1 text-xs text-secondary sm:text-sm">{attempt.date}</p>
          </div>
        ))}
      />
    </div>
  );
}

function HomeworkReadonlyPanel({
  questions,
  attempts,
  todayData,
}: {
  questions: HomeworkQuestionItem[];
  attempts: HomeworkQuestionAttempt[];
  todayData: HomeworkTodayData;
}) {
  const t = useText();
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCardLike title={t("Question bank progress", "题库进度")}>
        <div className="space-y-3">
          {todayData.subjectProgress.length > 0 ? (
            todayData.subjectProgress.map((item) => (
              <div key={item.subject} className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-bold text-foreground">{item.subject}</p>
                <p className="mt-1 text-xs text-secondary sm:text-sm">
                  {item.completed}/{item.total}
                </p>
              </div>
            ))
          ) : (
            <EmptyHint text={t("No homework question bank imported yet.", "还没有导入作业题库。")} />
          )}
        </div>
        {todayData.question ? (
          <div className="mt-5 rounded-2xl bg-surface-container p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t("Today's assigned question", "今日题目")}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{todayData.question.prompt}</p>
          </div>
        ) : null}
      </SectionCardLike>
      <HistoryColumn
        title={t("Recent grading attempts", "最近判题记录")}
        items={attempts.map((attempt) => (
          <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">{attempt.subject}</p>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", attempt.correct ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>
                {attempt.correct ? t("Correct", "正确") : t("Incorrect", "错误")}
              </span>
            </div>
            <p className="mt-1 text-xs text-secondary sm:text-sm">{attempt.date}</p>
          </div>
        ))}
      />
    </div>
  );
}

function ReadingReadonlyPanel({
  passages,
  attempts,
}: {
  passages: ReadingPassageItem[];
  attempts: ReadingQuizAttempt[];
}) {
  const t = useText();
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCardLike title={t("Reading bank", "阅读材料库")}>
        <div className="space-y-3">
          {passages.length > 0 ? (
            passages.map((passage) => (
              <div key={passage.id} className="rounded-2xl bg-white px-4 py-4">
                <p className="text-sm font-bold text-foreground">{passage.title}</p>
                <p className="mt-1 text-xs text-secondary sm:text-sm line-clamp-4">{passage.passage}</p>
              </div>
            ))
          ) : (
            <EmptyHint text={t("No reading passages imported yet.", "还没有导入阅读文章。")} />
          )}
        </div>
      </SectionCardLike>
      <HistoryColumn
        title={t("Recent reading results", "最近阅读结果")}
        items={attempts.map((attempt) => (
          <div key={attempt.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-bold text-foreground">{attempt.title}</p>
            <p className="mt-1 text-xs text-secondary sm:text-sm">{attempt.date}</p>
            <p className="mt-2 text-xs text-secondary sm:text-sm">
              {attempt.correctCount}/{attempt.totalQuestions}
            </p>
          </div>
        ))}
      />
    </div>
  );
}

function ImportCard({
  title,
  description,
  templateHref,
  templateLabel,
  children,
}: {
  title: string;
  description: string;
  templateHref: string;
  templateLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title}</p>
      <p className="mt-3 text-sm leading-7 text-secondary">{description}</p>
      <Link href={templateHref} download className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
        {templateLabel}
      </Link>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function SectionCardLike({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function HistoryColumn({ title, items }: { title: string; items: ReactNode[] }) {
  const t = useText();
  return (
    <div className="rounded-3xl border border-black/5 bg-surface-container-low p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title}</p>
      <div className="mt-4 max-h-[34rem] space-y-4 overflow-y-auto pr-1">
        {items.length > 0 ? items : <EmptyHint text={t("No records yet.", "还没有记录。")} />}
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-6 text-sm text-secondary">{text}</div>;
}

function FieldGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-semibold text-secondary">{label}</span>
      {children}
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn("w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm", className)}
    />
  );
}

function TextareaField({
  value,
  onChange,
  placeholder,
  minHeight = "min-h-24",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn("w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm", minHeight)}
    />
  );
}
