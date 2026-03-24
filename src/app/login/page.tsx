import { redirect } from "next/navigation";
import Link from "next/link";

import { LoginForm } from "@/components/client-tools";
import { getDemoAccounts } from "@/lib/data";
import { getDefaultRoute } from "@/lib/routes";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(getDefaultRoute(session.role));
  }

  const accounts = getDemoAccounts();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-terra md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-12 text-white md:flex">
          <div>
            <h1 className="font-serif text-4xl font-bold">Terra Edu</h1>
            <p className="mt-4 max-w-sm text-lg leading-8 text-white/80">
              Your organic path to global education excellence.
            </p>
          </div>
          <blockquote className="border-l-2 border-white/30 pl-4 italic text-white/75">
            Rooted in tradition, branching out to the world.
          </blockquote>
        </section>

        <section className="bg-white p-8 sm:p-12">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="mt-2 text-secondary">Sign in with the launch demo accounts or wire Supabase credentials later.</p>
          </div>

          <LoginForm />

          <div className="mt-8 rounded-3xl bg-surface-container-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Demo accounts</p>
            <div className="mt-4 space-y-3 text-sm text-secondary">
              {accounts.map((account) => (
                <div key={account.role} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="font-semibold capitalize text-foreground">{account.role}</p>
                  <p>{account.email}</p>
                  <p>{account.password}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">First login</p>
              <p className="mt-2 text-sm text-secondary">
                Grade, target countries, dream schools, and intended major are editable after login.
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-high p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">Debug ready</p>
              <p className="mt-2 text-sm text-secondary">
                Auth routes emit structured responses and can later switch to Supabase without changing page layout.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-secondary">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
