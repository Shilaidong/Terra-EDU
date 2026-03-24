/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Bot, Compass, Shield, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf6f0]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-serif text-2xl font-bold text-primary">Terra Global Ed</div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-lg font-semibold text-primary">
              Features
            </a>
            <a href="#roles" className="text-lg text-secondary transition-colors hover:text-primary">
              About
            </a>
          </div>
          <Link href="/login" className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white">
            Sign In
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 pb-32 pt-20 md:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="font-serif text-5xl font-bold leading-[1.05] text-foreground md:text-7xl">
              Your organic path to global education <span className="italic text-primary">excellence.</span>
            </h1>
            <p className="max-w-xl text-xl leading-9 text-secondary">
              A grounded, human approach to international admissions. We combine AI-driven precision with holistic mentorship to help every stakeholder move with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-terra">
                Start Your Journey
              </Link>
              <a
                href="#features"
                className="rounded-2xl border border-outline-variant bg-surface-container px-8 py-4 text-lg font-bold text-primary"
              >
                View Features
              </a>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-secondary">
              <span className="rounded-full bg-surface-container px-4 py-2">Vercel-ready deployment</span>
              <span className="rounded-full bg-surface-container px-4 py-2">Supabase adapter included</span>
              <span className="rounded-full bg-surface-container px-4 py-2">Traceable AI workflows</span>
            </div>
          </div>

          <div className="organic-glow">
            <img
              alt="Students collaborating in a bright campus courtyard"
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover ring-8 ring-surface-container-low shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="roles" className="bg-surface-container-low px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-4xl font-bold">Empowering the ecosystem</h2>
            <p className="mx-auto mt-4 max-w-2xl text-secondary">
              One platform, three perspectives. Tailored experiences for every stakeholder in the education journey.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Students",
                body: "Goal tracking, AI assistance, time-based planning, and mastery check-ins that keep momentum visible.",
                icon: <Compass className="h-6 w-6" />,
                tone: "text-primary bg-primary/10",
              },
              {
                title: "Parents",
                body: "Peace of mind through visibility. Stay aligned with progress, milestones, and consultant updates without micromanaging.",
                icon: <Users className="h-6 w-6" />,
                tone: "text-tertiary bg-tertiary/10",
              },
              {
                title: "Consultants",
                body: "Cohort management, content operations, analytics, import workflows, and AI-assisted reporting in one place.",
                icon: <Shield className="h-6 w-6" />,
                tone: "text-secondary bg-secondary-container",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-surface p-8 shadow-terra transition-transform hover:-translate-y-1">
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>{item.icon}</div>
                <h3 className="font-serif text-2xl font-bold text-primary">{item.title}</h3>
                <p className="mt-4 leading-8 text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="grid gap-6">
            <div className="flex items-start gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
              <Sparkles className="mt-1 h-6 w-6 text-primary" />
              <div>
                <h4 className="text-lg font-bold text-foreground">Gantt-style planning and milestones</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">Track exams, essays, deadlines, and applications across long planning cycles.</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
                <Bot className="h-8 w-8 text-tertiary" />
                <h4 className="mt-4 text-lg font-bold">AI Twin & recommendations</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">Summaries, suggestions, and prompt-versioned outputs with trace ids.</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-terra">
                <Shield className="h-8 w-8 text-primary" />
                <h4 className="mt-4 text-lg font-bold">Logs built for future AI bug fixing</h4>
                <p className="mt-2 text-sm leading-7 text-secondary">Every mutation stores actor, page, action, latency, trace_id, and decision_id.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-4xl font-bold">Tools built for the modern student.</h2>
            <p className="mt-4 text-lg leading-9 text-secondary">
              Education planning should not feel like paperwork. Terra combines warm design with structured backend behavior so the product can launch cleanly and stay maintainable.
            </p>
            <div className="mt-8 rounded-3xl bg-primary p-8 text-white shadow-terra">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">AI Innovation</p>
              <h3 className="mt-3 font-serif text-4xl font-bold">Your digital twin for global success</h3>
              <p className="mt-4 max-w-2xl text-white/85">
                The launch version ships practical AI: recommendation summaries, study prioritization, risk notes, and consultant reporting prompts with full traceability.
              </p>
              <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary">
                Enter the product
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-secondary md:flex-row md:items-center md:justify-between">
          <p>© 2026 Terra Edu. International education planning platform.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/login" className="hover:text-primary">
              Product
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
