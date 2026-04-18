# 引路人生涯探索系统 / Lodestar Career Exploration System

系统级产品说明、维护入口、调试思路与升级建议，请先看：

- [`docs/product-system-handbook.md`](/Users/shi/projects/edu-platform/terra-edu/docs/product-system-handbook.md)

Terra Edu is a launch-ready Next.js web app built from the Stitch UI designs in [`/Users/shi/projects/edu-platform/UIDESIGN`](/Users/shi/projects/edu-platform/UIDESIGN). It ships a warm Terra visual system, student/parent/consultant role portals, traceable API routes, and mock-first data storage that can later move to Supabase.

## What is live

- Marketing landing page and login page
- Student pages: dashboard, timeline, check-ins, explore, settings
- Parent page: dashboard
- Consultant pages: students, content, analytics
- Placeholder pages for undeclared-but-visible navigation routes so there are no dead links
- Structured write APIs with `trace_id`, `decision_id`, actor, page, latency, and result
- AI endpoints for recommendation summaries and student Q&A in practical launch mode

## Demo accounts

- Student: `student@terra.edu` / `terra123`
- Parent: `parent@terra.edu` / `terra123`
- Consultant: `consultant@terra.edu` / `terra123`

## Access plans and admin binding

- The current external entry uses a plan/access explanation flow instead of open self-service registration
- Student, parent, and consultant demo accounts can still be used for product preview
- Admin bindings are managed from [`/admin/dashboard`](/Users/shi/projects/edu-platform/terra-edu/src/app/admin/dashboard/page.tsx)
- Student cold-start data can be imported through the admin dashboard and related templates in `docs/`

If your current Supabase project was created before admin support was added, run:

- [`supabase/patches/008_add_admin_and_public_registration.sql`](/Users/shi/projects/edu-platform/terra-edu/supabase/patches/008_add_admin_and_public_registration.sql)
- Then run `npm run setup:supabase-auth` again so the admin auth user is created too

## Auth modes

- `TERRA_AUTH_MODE=auto`: try Supabase Auth first when fully configured, otherwise fall back to demo auth
- `TERRA_AUTH_MODE=demo`: always use built-in demo accounts
- `TERRA_AUTH_MODE=supabase`: require real Supabase email/password login
- `NEXT_PUBLIC_TERRA_AUTH_MODE` should usually match `TERRA_AUTH_MODE`

If you want the three demo accounts to exist in Supabase Auth too, run:

```bash
npm run setup:supabase-auth
```

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build checks

```bash
npm run lint
npm run build
```

## Environment

Copy [`.env.example`](/Users/shi/projects/edu-platform/terra-edu/.env.example) to `.env.local`.

- `TERRA_AI_PROVIDER`
- `TERRA_AI_MODEL`
- `TERRA_AI_PROMPT_VERSION`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TERRA_AUTH_MODE`
- `NEXT_PUBLIC_TERRA_AUTH_MODE`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

AI currently supports a launch-safe provider switch:

- `TERRA_AI_PROVIDER=auto`: use MiniMax over Anthropic-compatible mode when `ANTHROPIC_API_KEY` is set, otherwise fall back to mock AI
- `TERRA_AI_PROVIDER=mock`: always use the built-in simulated AI responses
- `TERRA_AI_PROVIDER=minimax_anthropic`: intended production mode; with the current implementation this behaves like `auto` plus MiniMax credentials

MiniMax Anthropic-compatible mode follows the official MiniMax setup:

- `ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic`
- `ANTHROPIC_API_KEY=your MiniMax Token Plan key`
- `TERRA_AI_MODEL=MiniMax-M2.7`

The current implementation runs fully in mock/demo mode if AI or Supabase credentials are not set. Supabase support is scaffolded via [`src/lib/supabase.ts`](/Users/shi/projects/edu-platform/terra-edu/src/lib/supabase.ts).

## Logging and future AI bug fixing

All write routes return:

- `success`
- `entity_id`
- `trace_id`
- `decision_id`
- `message`

Audit logs are stored in the in-memory launch store and rendered in the UI on key pages. The main write handlers live under:

- [`src/app/api/auth/login/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/auth/login/route.ts)
- [`src/app/api/student/checkins/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/student/checkins/route.ts)
- [`src/app/api/student/profile/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/student/profile/route.ts)
- [`src/app/api/student/tasks/[taskId]/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/student/tasks/[taskId]/route.ts)
- [`src/app/api/consultant/tasks/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/consultant/tasks/route.ts)
- [`src/app/api/content/items/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/content/items/route.ts)
- [`src/app/api/content/import/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/content/import/route.ts)
- [`src/app/api/ai/recommendations/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/ai/recommendations/route.ts)
- [`src/app/api/ai/chat/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/ai/chat/route.ts)

Shared observability helpers live in:

- [`src/lib/observability.ts`](/Users/shi/projects/edu-platform/terra-edu/src/lib/observability.ts)
- [`src/lib/store.ts`](/Users/shi/projects/edu-platform/terra-edu/src/lib/store.ts)

Production-prep assets live in:

- [`src/lib/env.ts`](/Users/shi/projects/edu-platform/terra-edu/src/lib/env.ts)
- [`src/app/api/health/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/health/route.ts)
- [`src/app/api/diagnostics/route.ts`](/Users/shi/projects/edu-platform/terra-edu/src/app/api/diagnostics/route.ts)
- [`supabase/schema.sql`](/Users/shi/projects/edu-platform/terra-edu/supabase/schema.sql)
- [`supabase/seed.sql`](/Users/shi/projects/edu-platform/terra-edu/supabase/seed.sql)
- [`instrumentation.ts`](/Users/shi/projects/edu-platform/terra-edu/instrumentation.ts)
- [`instrumentation-client.ts`](/Users/shi/projects/edu-platform/terra-edu/instrumentation-client.ts)
- [`sentry.server.config.ts`](/Users/shi/projects/edu-platform/terra-edu/sentry.server.config.ts)
- [`sentry.edge.config.ts`](/Users/shi/projects/edu-platform/terra-edu/sentry.edge.config.ts)

## Current limitations

- Data persistence is in-memory for this first implementation. Restarting the server resets demo data.
- Supabase and Sentry environment wiring are scaffolded but not activated without credentials.
- `xlsx` currently introduces one high-severity `npm audit` warning through its dependency chain; review before production rollout.
