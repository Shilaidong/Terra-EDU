import { ShieldCheck } from "lucide-react";

import {
  AdminBindingManager,
  AdminMemberProvisioner,
  AdminMemberManager,
  AdminStudentImportManager,
  LogoutButton,
} from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getAdminOverviewData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const session = await requireSession("admin");
  const overview = await getAdminOverviewData();

  const parents = overview.users.filter((user) => user.role === "parent");
  const consultants = overview.users.filter((user) => user.role === "consultant");
  const students = overview.students;
  const members = overview.users
    .filter(
      (
        user
      ): user is (typeof overview.users)[number] & {
        role: "student" | "parent" | "consultant";
      } => user.role !== "admin"
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      linkedStudents:
        user.role === "parent"
          ? overview.parentLinks
              .filter((link) => link.parentUserId === user.id)
              .map((link) => students.find((student) => student.id === link.studentId)?.name ?? link.studentId)
          : user.role === "consultant"
            ? overview.consultantLinks
                .filter((link) => link.consultantUserId === user.id)
                .map((link) => students.find((student) => student.id === link.studentId)?.name ?? link.studentId)
            : students.filter((student) => student.userId === user.id).map((student) => student.name),
    }));

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Admin Dashboard", "管理员后台")}
      subtitle={pickText(
        locale,
        "Manage public registrations, bind parents and consultants to students, and keep access relationships clean.",
        "管理公开注册账号，把家长和顾问绑定到学生，并保持整个平台的访问关系清晰。"
      )}
      activeHref="/admin/dashboard"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<ShieldCheck className="h-4 w-4" />} title={pickText(locale, "Admin scope", "管理范围")} value={pickText(locale, "Registrations + bindings", "注册 + 绑定")} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
        <StatCard label={pickText(locale, "Students", "学生")} value={`${students.length}`} hint={pickText(locale, "All student records in the platform.", "平台里的全部学生记录。")} />
        <StatCard label={pickText(locale, "Parents", "家长")} value={`${parents.length}`} hint={pickText(locale, "All parent accounts awaiting or holding bindings.", "所有待绑定或已绑定的家长账号。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Consultants", "顾问")} value={`${consultants.length}`} hint={pickText(locale, "All consultant accounts awaiting or holding bindings.", "所有待绑定或已绑定的顾问账号。")} tone="secondary" />
        <StatCard label={pickText(locale, "Bindings", "绑定数")} value={`${overview.parentLinks.length + overview.consultantLinks.length}`} hint={pickText(locale, "Current parent-student and consultant-student relationships.", "当前家长-学生和顾问-学生关系总数。")} />
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={pickText(locale, "Manual member setup", "手动建档")}
          eyebrow={pickText(locale, "Second-level admin menu", "二级管理菜单")}
        >
          <AdminMemberProvisioner />
        </SectionCard>

        <SectionCard
          title={pickText(locale, "Registration Queue and Bindings", "注册队列与绑定")}
          eyebrow={pickText(locale, "Admin operations", "管理员操作")}
        >
          <AdminBindingManager
            students={students.map((student) => ({
              id: student.id,
              name: student.name,
              grade: student.grade,
              school: student.school,
            }))}
            parents={parents.map((user) => ({ id: user.id, name: user.name, email: user.email }))}
            consultants={consultants.map((user) => ({ id: user.id, name: user.name, email: user.email }))}
            parentLinks={overview.parentLinks}
            consultantLinks={overview.consultantLinks}
          />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "How the logic works", "这套逻辑怎么工作")}
            eyebrow={pickText(locale, "Platform rules", "平台规则")}
          >
            <div className="space-y-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
              <p>{pickText(locale, "Students can be created manually by admin or imported in bulk, and they immediately receive their own archive.", "学生可以由管理员手动建档，也可以批量导入，创建后会立刻拥有自己的完整档案。")}</p>
              <p>{pickText(locale, "Parents and consultants can also be created manually. They only see student data after binding or assignment.", "家长和顾问也可以手动创建，但只有在绑定或分配学生后，才会看到对应学生数据。")}</p>
              <p>{pickText(locale, "One student can be linked to multiple parents and multiple consultants at the same time.", "同一个学生现在可以同时绑定多个家长，也可以同时分配给多个顾问。")}</p>
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Default admin account", "默认管理员账号")}
            eyebrow={pickText(locale, "Launch helper", "首发辅助")}
          >
            <div className="rounded-2xl bg-white px-4 py-4 text-xs text-secondary sm:text-sm">
              <p className="font-semibold text-foreground">admin@terra.edu</p>
              <p className="mt-1">terra123</p>
            </div>
          </SectionCard>
        </div>
        <SectionCard
          title={pickText(locale, "Student workbook import", "学生工作簿导入")}
          eyebrow={pickText(locale, "Migration helper", "迁移辅助")}
        >
          <AdminStudentImportManager />
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard
          title={pickText(locale, "Member exports, password reset, and deletion", "成员导出、改密与删除")}
          eyebrow={pickText(locale, "High-impact operations", "高影响操作")}
        >
          <AdminMemberManager members={members} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
