"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { pickText, type Locale } from "@/lib/locale";

type DemoAccount = {
  role: "student" | "parent" | "consultant";
  email: string;
  password: string;
};

export function AccessPlansDialog({
  locale,
  accounts,
  triggerLabel,
  triggerClassName,
}: {
  locale: Locale;
  accounts: DemoAccount[];
  triggerLabel: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/45 px-4 py-6 backdrop-blur-sm sm:py-10">
              <div className="flex min-h-full items-start justify-center sm:items-center">
                <div className="relative my-auto w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:max-h-[90vh] sm:overflow-y-auto sm:p-8">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-secondary transition hover:text-foreground"
                    aria-label={pickText(locale, "Close", "关闭")}
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="pr-12">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      {pickText(locale, "Access Plans", "开通方案")}
                    </p>
                    <h2 className="mt-3 font-serif text-3xl font-bold text-foreground">
                      {pickText(locale, "Guided onboarding access", "咨询开通")}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
                      {pickText(
                        locale,
                        "Registration is currently opened through guided consultation. Pricing and collaboration depth are confirmed together before access is enabled.",
                        "当前注册通过咨询开通。价格、协作深度与账号配置会在沟通后一起确认，再正式开通。"
                      )}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-surface-container-low p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        {pickText(locale, "Student access", "学生端方案")}
                      </p>
                      <p className="mt-3 font-serif text-4xl font-bold text-foreground">?99</p>
                      <p className="mt-3 text-sm leading-7 text-secondary">
                        {pickText(
                          locale,
                          "Includes student-facing planning, document workspace, AI guidance, and parent-consultant collaboration visibility.",
                          "包含学生端规划、材料中心、AI 助手，以及与家长和顾问协作相关的完整体验。"
                        )}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-surface-container-low p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">
                        {pickText(locale, "Consultant access", "顾问端方案")}
                      </p>
                      <p className="mt-3 font-serif text-4xl font-bold text-foreground">?999</p>
                      <p className="mt-3 text-sm leading-7 text-secondary">
                        {pickText(
                          locale,
                          "Includes multi-student workspace, planning book maintenance, content operations, AI reporting, and long-range collaboration tooling.",
                          "包含多学生工作台、规划书维护、内容管理、AI 周报以及长期协作所需的完整顾问能力。"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-surface-container-high p-5 text-sm text-secondary">
                    <p className="font-semibold text-foreground">
                      {pickText(locale, "Contact for full proposal", "具体方案请联系")}
                    </p>
                    <p className="mt-2">
                      {pickText(locale, "Teacher Shi · WeChat: shilaidong", "史老师 · 微信号：shilaidong")}
                    </p>
                  </div>

                  <div className="mt-6 rounded-3xl bg-surface-container-low p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      {pickText(locale, "Experience the platform first", "先体验平台")}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {accounts.map((account) => (
                        <div key={account.role} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                          <p className="font-semibold text-foreground">
                            {account.role === "student"
                              ? pickText(locale, "Sample student account", "示例学生账号")
                              : account.role === "parent"
                                ? pickText(locale, "Sample parent account", "示例家长账号")
                                : pickText(locale, "Sample consultant account", "示例顾问账号")}
                          </p>
                          <p className="mt-1 text-sm text-secondary">{account.email}</p>
                          <p className="text-sm text-secondary">{account.password}</p>
                          <p className="mt-2 text-xs leading-6 text-secondary">
                            {account.role === "student"
                              ? pickText(
                                  locale,
                                  "Recommended if you want to see the timeline, documents, AI guidance, and weekly execution from the student side.",
                                  "推荐先看时间线、材料中心、AI 助手和每周执行在学生端如何联动。"
                                )
                              : account.role === "parent"
                                ? pickText(
                                    locale,
                                    "Recommended if you want to see weekly progress, timeline visibility, and how parents follow the same shared plan without repeated reminders.",
                                    "推荐先看周进展、时间线可见性，以及家长如何在不反复催促的情况下看到同一份共享规划。"
                                  )
                                : pickText(
                                    locale,
                                    "Recommended if you want to see the student workspace, planning book, AI reports, and consultant-side coordination tools.",
                                    "推荐先看学生工作台、规划书、AI 周报和顾问端协同工具的完整形态。"
                                  )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
