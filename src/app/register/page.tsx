import Link from "next/link";
import { redirect } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-provider";
import { RegistrationForm } from "@/components/client-tools";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";

export default async function RegisterPage() {
  const locale = await getLocale();
  const session = await getSession();

  if (session) {
    redirect(getDefaultRoute(session.role));
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-terra md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-12 text-white md:flex">
          <div>
            <h1 className="font-serif text-4xl font-bold">{pickText(locale, "Lodestar Pathways", "引路人生涯")}</h1>
            <p className="mt-4 max-w-sm text-lg leading-8 text-white/80">
              {pickText(
                locale,
                "Create a student, parent, or consultant account and let the admin bind relationships afterward.",
                "创建学生、家长或顾问账号，后续再由管理员完成绑定关系。"
              )}
            </p>
          </div>
          <blockquote className="border-l-2 border-white/30 pl-4 italic text-white/75">
            {pickText(locale, "Accounts first, bindings second.", "先注册账号，再完成绑定。")}
          </blockquote>
        </section>

        <section className="bg-white p-8 sm:p-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">{pickText(locale, "Create Account", "创建账号")}</h2>
              <p className="mt-2 text-secondary">
                {pickText(
                  locale,
                  "Students can complete onboarding after login. Parent and consultant accounts wait for admin binding.",
                  "学生注册后可继续完善资料；家长和顾问注册后需要等待管理员绑定到对应学生。"
                )}
              </p>
            </div>
            <LocaleSwitcher />
          </div>

          <RegistrationForm />

          <div className="mt-8 rounded-3xl bg-surface-container-low p-5 text-sm text-secondary">
            <p className="font-semibold text-foreground">{pickText(locale, "Binding logic", "绑定逻辑")}</p>
            <p className="mt-2">
              {pickText(
                locale,
                "A parent only sees the student they are linked to. A consultant only sees the students assigned by admin.",
                "家长只会看到自己被绑定的学生；顾问只会看到管理员分配给自己的学生。"
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary">
            <Link href="/login" className="hover:text-primary">
              {pickText(locale, "Back to login", "返回登录")}
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              {pickText(locale, "Privacy Policy", "隐私政策")}
            </Link>
            <Link href="/terms" className="hover:text-primary">
              {pickText(locale, "Terms of Service", "服务条款")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
