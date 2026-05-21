# AGENTS.md

## Quick commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # eslint . (no config present — likely needs eslint setup)
```

Use **pnpm** — there is a `pnpm-workspace.yaml` (allows native `sharp` builds).

## Environment

Copy `.env.example` to `.env.local` and fill in real values. `.env*.local` is gitignored.

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `REPLICATE_API_TOKEN`.

Credit-cost env vars (`CREDIT_COST_*`) default to hardcoded fallbacks in API routes if unset.

## Build quirks

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — type errors do **not** block builds.
- `images.unoptimized: true` — Next.js `<Image>` is disabled; images are served directly.
- Tailwind v4 (CSS-first config via `@theme` in `app/globals.css`). No `tailwind.config.*` file. PostCSS plugin is `@tailwindcss/postcss`.

## Codebase structure

```
app/                     # Next.js App Router pages + API routes
  api/
    auth/signin|signup   # Auth endpoints
    generate/            # Image generation (sync + async per mode)
    webhooks/replicate/  # Replicate prediction callbacks
    upload/              # File upload
    user/credits/        # Credit balance
  gallery/               # /gallery page
  workbench/             # /workbench page
lib/
  supabase.ts            # Client-side Supabase (anon key, browser)
  supabase-server.ts     # Server-side: cookie-based + service-role client
  api.ts                 # Shared API helpers (verifyAuth, checkAndDeductCredits, response wrappers)
  database.ts            # Direct DB CRUD (imports supabaseAdmin — see caveat below)
  replicate.ts           # Synchronous Replicate runs
  auth.ts                # Supabase Auth wrappers
  storage.ts             # Supabase Storage operations
  utils.ts               # cn() classname utility
components/
  ui/                    # shadcn/ui components (new-york style, lucide icons)
  gallery/ workbench/    # Page-specific components
supabase/                # SQL schema files (run in Supabase SQL editor, not automated migrations)
```

## Important: supabaseAdmin import issue

`lib/database.ts`, `lib/auth.ts`, and `lib/storage.ts` all `import { supabaseAdmin } from './supabase'`, but `lib/supabase.ts` does **not** export `supabaseAdmin`. The intended service-role client is `createServiceClient()` from `lib/supabase-server.ts`, which newer code (API routes, `lib/api.ts`) uses correctly. These older files may have stale/untested code.

When adding DB operations, follow the pattern in `lib/api.ts`: call `createServiceClient()` to get a service-role Supabase client.

## API route conventions

All API routes follow this pattern (see `app/api/generate/text-async/route.ts`):
1. `verifyAuth(request)` — Bearer token JWT check
2. Zod schema validation with `.safeParse()`
3. `checkAndDeductCredits()` — checks balance, deducts, creates transaction record
4. `createGenerationRecord()` — inserts row in `generations` table
5. Call external service (Replicate)
6. On failure: update generation status to `failed`, rollback credits via `update_credits` RPC
7. Return `NextResponse.json()` using `createSuccessResponse` / `createErrorResponse` wrappers

## Webhook handling

Replicate webhook hits `POST /api/webhooks/replicate`. It looks up the generation by `settings->>replicate_id` (JSONB path query). On success it downloads the output image, uploads to Supabase Storage bucket `generated` under `{userId}/{generationId}.png`, and updates the generation status to `completed`. On failure, it rolls back credits.

## shadcn/ui

Components use `@/components/ui/*` path. New component dependencies were auto-installed via `npx shadcn@latest add <component>`. The `components.json` at project root governs the installation config (new-york style, CSS variables, lucide icons). `cn()` from `@/lib/utils` is used for classname merging.

## Database

Supabase SQL scripts are in `supabase/` and must be run manually in the Supabase SQL editor. There is no migration framework.

The `update_credits` RPC function (defined in `supabase/functions.sql`) handles atomic credit updates. Never update credits with a raw `UPDATE` — use the RPC to avoid race conditions.
