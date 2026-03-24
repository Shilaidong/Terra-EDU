import type { UserRole } from "@/lib/types";

export function getDefaultRoute(role: UserRole) {
  if (role === "student") {
    return "/student/dashboard";
  }

  if (role === "parent") {
    return "/parent/dashboard";
  }

  return "/consultant/students";
}
