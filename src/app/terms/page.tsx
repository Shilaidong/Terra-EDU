import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Terra Edu
        </Link>
        <h1 className="mt-6 font-serif text-5xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-secondary">Last updated: March 25, 2026</p>

        <div className="mt-10 space-y-8 rounded-[2rem] bg-white p-8 shadow-terra">
          <section>
            <h2 className="font-serif text-2xl font-bold">Use of the platform</h2>
            <p className="mt-3 leading-8 text-secondary">
              Terra Edu is an education-planning tool for students, parents, and consultants. It helps organize tasks, content, and guidance, but it does not guarantee admissions outcomes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Accounts and access</h2>
            <p className="mt-3 leading-8 text-secondary">
              Users are responsible for protecting their credentials and using role-based access appropriately. Parent accounts are read-only in the current launch workflow and should not attempt to bypass permission boundaries.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">AI-generated content</h2>
            <p className="mt-3 leading-8 text-secondary">
              AI suggestions are provided as operational guidance, not professional, legal, or admissions guarantees. Human review remains important for decisions and submissions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold">Launch-stage limitation</h2>
            <p className="mt-3 leading-8 text-secondary">
              This product currently includes placeholder modules, evolving integrations, and observability tooling for rapid bug fixing. Before public launch, replace this placeholder text with your business-specific legal terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
