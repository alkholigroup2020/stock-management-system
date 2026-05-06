# Repository Guidelines

## Project Overview

This repository contains a production multi-location stock management system for
tracking inventory across Kitchen, Store, Central, and Warehouse locations. It
replaces spreadsheet workflows with real-time stock tracking, weighted average
costing, inter-location transfers, approval workflows, and coordinated
period-end close.

This is a Nuxt 4 application, not Nuxt 3. Use Nuxt 4 documentation and patterns
when implementing features or resolving framework issues.

## Production Safety

This application is live with real users and data. Treat all changes as
production-impacting unless proven otherwise.

- Do not make breaking API, type, or database-schema changes without an explicit
  migration path and compatibility plan.
- Preserve existing data. Schema changes should be additive or use safe,
  reversible migration strategies.
- Use proper migrations for production deployment: `pnpm db:migrate:deploy`.
  Never use `pnpm db:push` in production.
- Do not run destructive operations, delete data, or rewrite existing records
  without explicit user confirmation and backup verification.
- Before changing APIs, Prisma models, auth, permissions, stock calculations, or
  workflows, consider rollback, backwards compatibility, and testing in a
  non-production environment.

## Project Structure & Module Organization

This is a single Nuxt 4 app in SPA mode with frontend and backend in one repo.
Nuxt 4 uses `app/`, not `src/`.

- `app/`: Frontend pages, components, composables, layouts, stores, utilities,
  assets, plugins, middleware, and `app.vue`.
- `server/`: Nitro/H3 API routes, server middleware, and server utilities.
- `prisma/`: Prisma schema, migrations, and seed scripts.
- `shared/`: Shared TypeScript types.
- `project-docs/`: PRD, system design, API contracts, workflow guides, UI design
  system, deployment notes, and phased task plans.
- `tests/`: Vitest unit and integration tests when test coverage is added.
- `public/`: Static assets.

Do not edit generated build artifacts such as `.nuxt/` or `.output/`.

## Tech Stack

- Nuxt 4 with `ssr: false`
- Nuxt UI and Tailwind CSS v4
- Vue 3, Pinia, TypeScript, and Zod
- Nuxt server routes with Nitro/H3; no separate backend service
- PostgreSQL via Supabase and Prisma ORM
- `nuxt-auth-utils` with JWT/httpOnly cookie auth
- `@vite-pwa/nuxt` for installable, offline-aware PWA behavior
- Vercel for app/API hosting and Supabase for database hosting

## Build, Test, and Development Commands

- `pnpm install`: Install dependencies.
- `pnpm dev`: Start the Nuxt dev server at `http://localhost:3000`.
- `pnpm build`: Generate Prisma client and build the production bundle.
- `pnpm preview`: Run the built app locally.
- `pnpm generate`: Create a static build.
- `pnpm typecheck`: Run Nuxt TypeScript checks.
- `pnpm lint`: Lint the repo with ESLint.
- `pnpm format` / `pnpm format:check`: Format or verify formatting with
  Prettier.
- `pnpm db:push`: Apply Prisma schema changes locally only.
- `pnpm db:migrate`: Create/apply local Prisma development migrations.
- `pnpm db:migrate:deploy`: Apply migrations in production or deployment
  environments.
- `pnpm db:seed`: Seed the database with `prisma/seed.ts`.
- `pnpm db:studio`: Open Prisma Studio.

Only use `http://localhost:3000` as the dev-server URL unless the user directs
otherwise.

## Coding Style & Naming Conventions

Use 2-space indentation and LF line endings per `.editorconfig`. Prettier is the
source of truth (`.prettierrc`):

- Semicolons are required.
- Use double quotes.
- Keep lines at or below 100 characters.
- Use ES5 trailing commas.
- Always use parentheses around arrow-function parameters.
- Do not indent `<script>` or `<style>` blocks in Vue files.

Follow Nuxt ESLint defaults from `eslint.config.mjs`. Avoid `any`; use proper
interfaces, type guards in error handlers, typed API responses, and careful
Prisma Decimal handling.

Components are auto-imported. Component names combine folder path and filename:

- `app/components/layout/AppNavbar.vue` becomes `<LayoutAppNavbar />`.
- `app/components/delivery/LineItem.vue` becomes `<DeliveryLineItem />`.
- `app/components/ui/form/Input.vue` becomes `<UiFormInput />`.
- Root `app/components/Footer.vue` becomes `<Footer />`.

When tests are added, name them `*.test.ts` under `tests/`.

## Testing Guidelines

Automated test scripts are not currently defined in `package.json`. When adding
test coverage, prefer Vitest for unit/integration tests under `tests/` and
Playwright for browser-level checks.

Before finishing code work, run `pnpm typecheck` and fix all errors. For UI work
or debugging browser behavior, use the Playwright/browser MCP after completing
the task to check the result. If typecheck, formatting, or relevant verification
cannot be run, report that clearly.

## Architecture and API Patterns

Frontend pages live in `app/pages/`, feature components in `app/components/`,
Pinia stores in `app/stores/`, and composables in `app/composables/`. Backend
API routes live in `server/api/`; middleware lives in `server/middleware/`.

Use `defineEventHandler` for API routes. All `/api/*` routes are expected to be
auth-protected, and authenticated user data is available via
`event.context.user`. Location access middleware validates user access to
`locationId` route params.

Use this error shape for API failures:

```ts
createError({
  statusCode,
  statusMessage,
  data: { code, message, details },
});
```

Common error codes include `INSUFFICIENT_STOCK`, `LOCATION_ACCESS_DENIED`,
`PERIOD_CLOSED`, `VALIDATION_ERROR`, and `PRICE_VARIANCE`.

## Business Logic Rules

- All stock operations are location-specific. Never skip `locationId` context.
- Never allow negative stock. Validate requested quantity against
  `locationStock.onHand` before issues and transfers.
- Never modify closed periods. Check `period.status === "OPEN"` before posting
  transactions.
- WAC updates only on deliveries. Issues deduct at current WAC and do not
  recalculate WAC.
- Delivery price variance against locked period price must generate an NCR with
  `type: PRICE_VARIANCE` and `auto_generated: true`.
- PRF/PO and transfers require Supervisor approval. Period Close requires Admin
  approval.
- Log every mutation with user, timestamp, action, and location context.
- Never expose Supabase service keys to client code.

Key workflow rules:

- WAC formula:
  `(currentQty * currentWAC + receivedQty * receiptPrice) / (currentQty + receivedQty)`.
- Transfer flow: `DRAFT -> PENDING_APPROVAL -> APPROVED -> COMPLETED`, with
  atomic execution.
- Period close requires all locations to be ready before Admin approval and
  simultaneous close with snapshots.

## Role-Based Access Control

- Operator: Post deliveries/issues and view stock for assigned locations.
- Supervisor: Approve transfers/PRF and manage reconciliations across locations.
- Admin: Manage items/prices, close periods, and configure the system.

Always verify both `user.role` and assigned location access in server routes.

## PWA and Offline Behavior

This is a Level 1 PWA: installable and offline-aware, without full offline data
sync in MVP. Use `useOnlineStatus()` to detect offline state and disable
mutation actions while offline, for example
`<UButton :disabled="!isOnline">`.

## Currency and Localization

- Currency: SAR, displayed as `SAR 1,234.56`.
- Currency decimals: 2.
- Quantity decimals: up to 4.
- Display dates as `DD/MM/YYYY`; use ISO 8601 for API values.
- Timezone: `Asia/Riyadh`.
- MVP language: English, with Arabic support planned.
- Units include `KG`, `EA`, `LTR`, `BOX`, `CASE`, and `PACK`.

## UI Design System

Use `project-docs/UI_DESIGN_SYSTEM.md` as the source of truth for colors,
semantic tokens, layout, spacing, component patterns, typography,
accessibility, and Tailwind CSS v4 constraints.

## Documentation Notes

When editing developer guide snippets in `app/components/developer/*.vue`,
include the real file path in the code block `filename` prop when the snippet
represents an actual file, for example `server/api/auth/login.post.ts`. Generic
conceptual examples may omit it.

When completing main tasks from task lists in `project-docs/dev-phases/`, mark
the related subtasks as complete and update `project-docs/TASK_COMPLETION_LOG.md`
with a short summary if that file exists for the current workflow.

## Configuration & Secrets

Use `.env.example` as the template and keep real secrets in `.env`. Never commit
service keys or database credentials. Required deployment/local variables
include `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_KEY`, `AUTH_SECRET`, `AUTH_ORIGIN`, `NUXT_PUBLIC_SITE_URL`,
and `NUXT_PUBLIC_CURRENCY`.

For Supabase with Prisma, use the transaction pooler connection on port `6543`
with `pgbouncer=true` when that connection mode is required.

## Commit & Pull Request Guidelines

Recent history uses short, imperative, sentence-case messages like `Add ...` or
`Fix ...`. Keep commits focused and descriptive. For PRs, include a clear
summary, testing performed, linked issues, screenshots or clips for UI changes,
and call out Prisma migrations or schema changes.

## Reference Documentation

Check official documentation before implementing framework or library features:

- Nuxt 4: `https://nuxt.com/docs`
- Nuxt UI: `https://ui.nuxt.com`
- Tailwind CSS: `https://tailwindcss.com/docs`
- Prisma: `https://www.prisma.io/docs`
- Pinia: `https://pinia.vuejs.org`
- Vue 3: `https://vuejs.org/guide`

Key local docs live in `project-docs/`, including PRD, system design, API
contract, workflow guides, permissions, deployment notes, and the UI design
system.
