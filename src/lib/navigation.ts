import { pickText, type Locale } from "@/lib/locale";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
}

export function getRoleNav(locale: Locale): Record<UserRole, NavItem[]> {
  return {
    admin: [
      { label: pickText(locale, "Dashboard", "仪表盘"), href: "/admin/dashboard" },
    ],
    student: [
      { label: pickText(locale, "Dashboard", "仪表盘"), href: "/student/dashboard" },
      { label: pickText(locale, "Timeline", "时间线"), href: "/student/timeline" },
      { label: pickText(locale, "Learning", "学习中心"), href: "/student/checkin" },
      { label: pickText(locale, "Explore", "探索"), href: "/student/explore" },
      { label: pickText(locale, "Settings", "设置"), href: "/student/settings" },
      { label: pickText(locale, "Applications", "申请"), href: "/student/applications" },
      { label: pickText(locale, "Documents", "材料"), href: "/student/documents" },
      { label: pickText(locale, "Messages", "消息"), href: "/student/messages" },
      { label: pickText(locale, "Finances", "财务"), href: "/student/finances" },
      { label: pickText(locale, "Support", "支持"), href: "/student/support" },
    ],
    parent: [
      { label: pickText(locale, "Dashboard", "仪表盘"), href: "/parent/dashboard" },
      { label: pickText(locale, "Learning", "学习中心"), href: "/parent/checkin" },
      { label: pickText(locale, "Applications", "申请"), href: "/parent/applications" },
      { label: pickText(locale, "Documents", "材料"), href: "/parent/documents" },
      { label: pickText(locale, "Finances", "财务"), href: "/parent/finances" },
      { label: pickText(locale, "Messages", "消息"), href: "/parent/messages" },
      { label: pickText(locale, "Settings", "设置"), href: "/parent/settings" },
      { label: pickText(locale, "Support", "支持"), href: "/parent/support" },
    ],
    consultant: [
      { label: pickText(locale, "Students", "学生"), href: "/consultant/students" },
      { label: pickText(locale, "Content", "内容"), href: "/consultant/content" },
      { label: pickText(locale, "Analytics", "分析"), href: "/consultant/analytics" },
      { label: pickText(locale, "Applications", "申请"), href: "/consultant/applications" },
      { label: pickText(locale, "Documents", "材料"), href: "/consultant/documents" },
      { label: pickText(locale, "Messages", "消息"), href: "/consultant/messages" },
      { label: pickText(locale, "Settings", "设置"), href: "/consultant/settings" },
      { label: pickText(locale, "Finances", "财务"), href: "/consultant/finances" },
    ],
  };
}
