import { LogoutButton } from "@/components/client-tools";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { PlaceholderCard, RoleShell } from "@/components/terra-shell";
import type { SessionPayload, UserRole } from "@/lib/types";

export async function RolePlaceholderPage({
  session,
  role,
  title,
  description,
  activeHref,
}: {
  session: SessionPayload;
  role: UserRole;
  title: string;
  description: string;
  activeHref: string;
}) {
  const locale = await getLocale();
  const localizedTitle = translatePlaceholderTitle(title, locale);
  const localizedDescription = translatePlaceholderDescription(role, title, locale);
  return (
    <RoleShell
      session={session}
      title={localizedTitle}
      subtitle={pickText(locale, "This launch-safe page keeps navigation complete while the deeper workflow grows incrementally.", "这个上线安全页会先保持导航完整，后续再逐步补充更深的流程。")}
      activeHref={activeHref}
      hero={<LogoutButton />}
    >
      <PlaceholderCard role={role} title={localizedTitle} description={locale === "zh" ? localizedDescription : description} />
    </RoleShell>
  );
}

function translatePlaceholderTitle(title: string, locale: "zh" | "en") {
  if (title === "Applications") return pickText(locale, "Applications", "申请");
  if (title === "Documents") return pickText(locale, "Documents", "材料");
  if (title === "Messages") return pickText(locale, "Messages", "消息");
  if (title === "Finances") return pickText(locale, "Finances", "财务");
  if (title === "Support") return pickText(locale, "Support", "支持");
  return title;
}

function translatePlaceholderDescription(role: UserRole, title: string, locale: "zh" | "en") {
  if (title === "Applications") {
    return pickText(locale, "Applications will expand here later.", role === "consultant" ? "这里后续会补充顾问侧申请工作流，当前先保留安全入口。" : "这里后续会补充申请相关流程，当前先保留安全入口。");
  }

  if (title === "Documents") {
    return pickText(locale, "Documents will expand here later.", "这里后续会补充材料查看与处理流程，当前先保留安全入口。");
  }

  if (title === "Messages") {
    return pickText(locale, "Messages will expand here later.", "这里后续会补充消息与沟通流程，当前先保留安全入口。");
  }

  if (title === "Finances") {
    return pickText(locale, "Finance workflows will expand here later.", "这里后续会补充财务与付款相关流程，当前先保留安全入口。");
  }

  if (title === "Support") {
    return pickText(locale, "Support workflows will expand here later.", "这里后续会补充帮助与支持流程，当前先保留安全入口。");
  }

  return "";
}
