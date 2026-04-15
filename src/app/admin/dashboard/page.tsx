import { ShieldCheck } from "lucide-react";

import {
  AdminBindingManager,
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
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<ShieldCheck className="h-4 w-4" />} title={pickText(locale, "Admin scope", "管理范围")} value={pickText(locale, "Registrations + bindings", "注册 + 绑定")} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label={pickText(locale, "Students", "学生")} value={`${students.length}`} hint={pickText(locale, "All student records in the platform.", "平台里的全部学生记录。")} />
        <StatCard label={pickText(locale, "Parents", "家长")} value={`${parents.length}`} hint={pickText(locale, "All parent accounts awaiting or holding bindings.", "所有待绑定或已绑定的家长账号。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Consultants", "顾问")} value={`${consultants.length}`} hint={pickText(locale, "All consultant accounts awaiting or holding bindings.", "所有待绑定或已绑定的顾问账号。")} tone="secondary" />
        <StatCard label={pickText(locale, "Bindings", "绑定数")} value={`${overview.parentLinks.length + overview.consultantLinks.length}`} hint={pickText(locale, "Current parent-student and consultant-student relationships.", "当前家长-学生和顾问-学生关系总数。")} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
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

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "How the logic works", "这套逻辑怎么工作")}
            eyebrow={pickText(locale, "Platform rules", "平台规则")}
          >
            <div className="space-y-3 text-sm leading-7 text-secondary">
              <p>{pickText(locale, "Students can register directly and get their own profile immediately.", "学生可以直接注册，并立刻拥有自己的学生档案。")}</p>
              <p>{pickText(locale, "Parents can register, but they only see data after an admin binds them to a student.", "家长可以先注册，但必须由管理员绑定到学生后才能看到对应数据。")}</p>
              <p>{pickText(locale, "Consultants can register, but they only manage the students assigned by admin.", "顾问可以先注册，但只能管理管理员分配给自己的学生。")}</p>
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Default admin account", "默认管理员账号")}
            eyebrow={pickText(locale, "Launch helper", "首发辅助")}
          >
            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-secondary">
              <p className="font-semibold text-foreground">admin@terra.edu</p>
              <p className="mt-1">terra123</p>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-8">
        <SectionCard
          title={pickText(locale, "Student workbook import", "学生工作簿导入")}
          eyebrow={pickText(locale, "Migration helper", "迁移辅助")}
        >
          <AdminStudentImportManager />
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard
          title={pickText(locale, "Member exports and deletion", "成员导出与删除")}
          eyebrow={pickText(locale, "High-risk operations", "高风险操作")}
        >
          <AdminMemberManager members={members} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
