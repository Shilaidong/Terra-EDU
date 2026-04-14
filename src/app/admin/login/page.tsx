import { redirect } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-provider";
import { LoginForm } from "@/components/client-tools";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";

export default async function AdminLoginPage() {
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

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-terra md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-12 text-white md:flex">
          <div>
            <h1 className="font-serif text-4xl font-bold">{pickText(locale, "Lodestar Admin", "引路人生涯管理后台")}</h1>
            <p className="mt-4 max-w-sm text-lg leading-8 text-white/80">
              {pickText(locale, "Protected admin access for registration review, member export, and binding controls.", "受保护的管理员入口，用于注册审核、成员导出和绑定管理。")}
            </p>
          </div>
        </section>

        <section className="bg-white p-8 sm:p-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">{pickText(locale, "Admin Login", "管理员登录")}</h2>
              <p className="mt-2 text-secondary">
                {pickText(locale, "This route is intentionally separate from the public login screen.", "这个入口故意和公开登录页分开。")}
              </p>
            </div>
            <LocaleSwitcher />
          </div>

          <LoginForm allowedRoles={["admin"]} />
        </section>
      </div>
    </main>
  );
}
