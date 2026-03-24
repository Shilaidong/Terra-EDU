import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
}

export const roleNav: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Timeline", href: "/student/timeline" },
    { label: "Check-ins", href: "/student/checkin" },
    { label: "Explore", href: "/student/explore" },
    { label: "Settings", href: "/student/settings" },
    { label: "Applications", href: "/student/applications" },
    { label: "Documents", href: "/student/documents" },
    { label: "Messages", href: "/student/messages" },
    { label: "Finances", href: "/student/finances" },
    { label: "Support", href: "/student/support" },
  ],
  parent: [
    { label: "Dashboard", href: "/parent/dashboard" },
    { label: "Applications", href: "/parent/applications" },
    { label: "Documents", href: "/parent/documents" },
    { label: "Finances", href: "/parent/finances" },
    { label: "Messages", href: "/parent/messages" },
    { label: "Settings", href: "/parent/settings" },
    { label: "Support", href: "/parent/support" },
  ],
  consultant: [
    { label: "Students", href: "/consultant/students" },
    { label: "Content", href: "/consultant/content" },
    { label: "Analytics", href: "/consultant/analytics" },
    { label: "Applications", href: "/consultant/applications" },
    { label: "Documents", href: "/consultant/documents" },
    { label: "Messages", href: "/consultant/messages" },
    { label: "Finances", href: "/consultant/finances" },
  ],
};
