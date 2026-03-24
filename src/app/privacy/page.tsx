import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Terra Edu
        </Link>
        <h1 className="mt-6 font-serif text-5xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-secondary">Last updated: March 25, 2026</p>

        <div className="mt-10 space-y-8 rounded-[2rem] bg-white p-8 shadow-terra">
          <section>
            <h2 className="font-serif text-2xl font-bold">What we collect</h2>
            <p className="mt-3 leading-8 text-secondary">
              Terra Edu may store account details, education-planning records, tasks, milestones, content management actions, and AI-generated summaries. In the current launch build, observability data also includes `trace_id`, `decision_id`, actor, page, latency, and status.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Why we collect it</h2>
            <p className="mt-3 leading-8 text-secondary">
              We use this information to operate student, parent, and consultant workflows, improve reliability, and diagnose bugs quickly. AI outputs are stored to make future debugging and audit review easier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Monitoring and diagnostics</h2>
            <p className="mt-3 leading-8 text-secondary">
              If Sentry is configured, runtime errors and selected request metadata may be sent to Sentry. If Supabase is configured, audit logs and AI artifacts may also be persisted for operational review.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Your choices</h2>
            <p className="mt-3 leading-8 text-secondary">
              You can request account updates or data removal through the support channel you publish with the product. Before public launch, replace this placeholder policy with your business-specific legal text and contact details.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
