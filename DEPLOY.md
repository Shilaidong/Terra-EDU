# Terra Edu Deployment Guide

This guide is written for the current app in [`/Users/shi/projects/edu-platform/terra-edu`](/Users/shi/projects/edu-platform/terra-edu).

## 1. Create the cloud services

### Vercel

1. Create a Vercel account.
2. Import this `terra-edu` folder as a new project.
3. Framework should auto-detect as Next.js.

### Supabase

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run [`supabase/schema.sql`](/Users/shi/projects/edu-platform/terra-edu/supabase/schema.sql).
4. Run [`supabase/seed.sql`](/Users/shi/projects/edu-platform/terra-edu/supabase/seed.sql) if you want starter data.
5. Copy:
   - Project URL
   - anon public key
   - service role key

### Sentry

1. Create a Sentry project for Next.js.
2. Copy:
   - Public DSN
   - org slug
   - project slug
   - auth token

## 2. Configure environment variables in Vercel

Add the following variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

Use [`.env.example`](/Users/shi/projects/edu-platform/terra-edu/.env.example) as the checklist.

## 3. Deploy

1. Trigger the first Vercel deployment.
2. Open:
   - `/api/health`
   - `/api/diagnostics`
3. Confirm the environment flags look correct.
4. Log in with the demo accounts and verify each role route.

## 4. Recommended smoke test

### Student

1. Log in with `student@terra.edu / terra123`.
2. Open dashboard, timeline, check-in, explore, settings.
3. Change a task status.
4. Save a check-in.
5. Generate an AI recommendation.

### Parent

1. Log in with `parent@terra.edu / terra123`.
2. Confirm dashboard loads.
3. Confirm placeholder pages do not 404.

### Consultant

1. Log in with `consultant@terra.edu / terra123`.
2. Add a task.
3. Create a content item.
4. Import a spreadsheet.
5. Download the analytics report.

## 5. What to watch after launch

- Sentry issues for runtime errors
- `/api/health` for env and record counts
- `/api/diagnostics` for recent traceable actions
- Audit logs in the consultant content and student dashboard pages

## 6. Important current limitation

The UI is launch-ready, but most user-facing data is still mock-first in memory. The new Supabase schema and persistence hooks are prepared, but the main read paths still use the in-memory store unless you extend the repository layer further.
